import { NextResponse } from "next/server"
import { parse, type HTMLElement } from "node-html-parser"
import { cachedByKey } from "@/lib/api-cache"
import { enforceRateLimit } from "@/lib/rate-limit"
import { resolveDisplayName, resolveLogoUrl, type LeagueKey } from "@/lib/logos"

export const runtime = "nodejs"
export const revalidate = 300

interface CodMatch {
  id: string
  team: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  startTime: string
  score?: {
    team: number
    opponent: number
  }
}

const SELECTORS = {
  rows: "tr",
  timer: ".timer-object",
  teamLink: "a[href^='/callofduty/']",
}

const LIQUIPEDIA_BASE = "https://liquipedia.net/callofduty"
const MAX_UPCOMING_MATCHES = 3
const MAX_RECENT_MATCHES = 10

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

const extractTeamFromHref = (href: string) => {
  const segment = href.split("#")[0].split("?")[0].split("/").filter(Boolean).pop() || ""
  return segment.replace(/_/g, " ")
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const userAgent = process.env.LIQUIPEDIA_UA || "HereticsTrackerBot/1.0 (configura LIQUIPEDIA_UA en el entorno)"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Api-User-Agent": userAgent,
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip",
      },
      next: { revalidate: 300 },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function scrapeTeamMatches(
  teamSlug: string,
  teamName: string,
  league: LeagueKey
): Promise<CodMatch[]> {
  const apiUrl = `${LIQUIPEDIA_BASE}/api.php?action=parse&page=${encodeURIComponent(teamSlug)}&prop=text&format=json&origin=*&redirects=1`

  try {
    const response = await fetchWithTimeout(apiUrl, 8000)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const json = (await response.json()) as { parse?: { text?: { "*"?: string } } }
    const html = json.parse?.text?.["*"]
    if (!html) return []

    const root = parse(html)
    const matches: CodMatch[] = []
    const seen = new Set<string>()

    for (const row of root.querySelectorAll(SELECTORS.rows)) {
      try {
        const timer = row.querySelector(SELECTORS.timer)
        const timestamp = timer?.getAttribute("data-timestamp")
        if (!timestamp) continue

        const start = new Date(Number(timestamp) * 1000)
        if (Number.isNaN(start.getTime())) continue

        const anchored = row.querySelectorAll(SELECTORS.teamLink).map((anchor) => ({
          text: anchor.text.trim(),
          href: anchor.getAttribute("href") || "",
        }))
        const linkDepth = (href: string) => href.split("/").filter(Boolean).length
        const teamLike = anchored.filter((anchor) => anchor.text && linkDepth(anchor.href) === 2)
        const ownName = normalizeName(teamName)
        const opponentLink = teamLike
          .filter((anchor) => normalizeName(anchor.text) !== ownName && !normalizeName(extractTeamFromHref(anchor.href)).includes("heretics"))
          .pop()
const opponent = resolveDisplayName(league, opponentLink?.text.trim() || "")
        if (!opponent) continue
        const opponentLogoUrl = resolveLogoUrl(league, opponent)

        const cells = row.querySelectorAll("td")
        const tournament = cells[3]?.text.trim()
        if (!tournament) continue

        const scoreValues = (cells[5]?.text || "")
          .trim()
          .split(":")
          .map((value) => Number(value.trim()))
        const score = scoreValues.length === 2 && scoreValues.every((value) => Number.isInteger(value))
          ? { team: scoreValues[0], opponent: scoreValues[1] }
          : undefined
        const id = `${teamSlug}-${timestamp}-${opponent}`
        if (seen.has(id)) continue
        seen.add(id)

        matches.push({
          id,
          team: teamName,
          opponent,
          ...(opponentLogoUrl ? { opponentLogoUrl } : {}),
          tournament,
          startTime: start.toISOString(),
          ...(score ? { score } : {}),
        })
      } catch {
        continue
      }
    }

    return matches
  } catch (error) {
    console.error(`[CoD API] Error scraping ${teamSlug}:`, error)
    return []
  }
}

async function scrapeCodMatches() {
  const [miamiMatches, teamMatches] = await Promise.all([
    scrapeTeamMatches("Miami_Heretics", "Miami Heretics", "cdl"),
    scrapeTeamMatches("Team_Heretics", "Team Heretics", "cdl"),
  ])
  const allMatches = [...miamiMatches, ...teamMatches]
  const unique = Array.from(new Map(allMatches.map((match) => [match.id, match])).values())
  const now = Date.now()
  const past = unique
    .filter((match) => new Date(match.startTime).getTime() < now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const upcoming = unique
    .filter((match) => new Date(match.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return [...past.slice(-MAX_RECENT_MATCHES), ...upcoming.slice(0, MAX_UPCOMING_MATCHES)]
}

const CACHE_TTL_MS = 300_000

export async function GET(request: Request) {
  const blocked = await enforceRateLimit(request, "cod")
  if (blocked) return blocked

  try {
    const matches = await cachedByKey("cod:matches", CACHE_TTL_MS, scrapeCodMatches)
    return NextResponse.json(matches, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("[CoD API] Error en GET handler:", error)
    return NextResponse.json([], { status: 200 })
  }
}
