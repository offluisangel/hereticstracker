import { NextResponse } from "next/server"
import { parse, type HTMLElement } from "node-html-parser"
import { cachedByKey } from "@/lib/api-cache"
import { enforceRateLimit } from "@/lib/rate-limit"
import { resolveDisplayName, resolveLogoUrl } from "@/lib/logos"

export const runtime = "nodejs"
export const revalidate = 300

interface R6SMatch {
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

const LIQUIPEDIA_BASE = "https://liquipedia.net/rainbowsix"
const TEAM_SLUG = "Team_Heretics"
const TEAM_NAME = "Team Heretics"
const MAX_UPCOMING = 3
const MAX_RECENT = 10

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const isOwnTeam = (value: string) => normalizeName(value).includes("heretics")

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const userAgent = process.env.LIQUIPEDIA_UA || "HereticsTrackerBot/1.0"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Api-User-Agent": userAgent,
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Referer: `${LIQUIPEDIA_BASE}/${TEAM_SLUG}`,
      },
      next: { revalidate: 300 },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function extractTimestamp(row: HTMLElement): number | null {
  const parseDateValue = (value: string | undefined) => {
    if (!value || value === "error") return null
    if (/^\d+$/.test(value)) {
      const number = Number(value)
      return number < 10_000_000_000 ? number : Math.floor(number / 1000)
    }

    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000)
  }

  const candidates = row.querySelectorAll(".timer-object, [data-timestamp], [data-sort-value], [datetime]")
  for (const candidate of candidates) {
    for (const attribute of ["data-timestamp", "data-timestamp-ms", "data-sort-value", "datetime", "data-date"]) {
      const timestamp = parseDateValue(candidate.getAttribute(attribute))
      if (timestamp) return timestamp
    }
  }

  const dateText = row.text.match(/\b\d{1,2}[\s/-]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s/-]+\d{4}\b/i)?.[0]
  const timestamp = parseDateValue(dateText)
  if (timestamp) return timestamp

  return null
}

function extractScore(row: HTMLElement): R6SMatch["score"] {
  const scoreText = row
    .querySelectorAll("td")
    .map((cell) => cell.text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim())
    .reverse()
    .find((value) => /^(\d+)\s*[:\-]\s*(\d+)$/.test(value))

  if (!scoreText) return undefined
  const match = scoreText.match(/^(\d+)\s*[:\-]\s*(\d+)$/)
  return match ? { team: Number(match[1]), opponent: Number(match[2]) } : undefined
}

async function scrapeMatches(): Promise<R6SMatch[]> {
  const cacheWindow = Math.floor(Date.now() / 300_000)
  const apiUrl = `${LIQUIPEDIA_BASE}/api.php?action=parse&page=${TEAM_SLUG}&prop=text&format=json&origin=*&redirects=1&_=${cacheWindow}`
  const response = await fetchWithTimeout(apiUrl, 10000)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const json = (await response.json()) as { parse?: { text?: { "*"?: string } } }
  const html = json.parse?.text?.["*"]
  if (!html) return []

  const root = parse(html)
  const matches: R6SMatch[] = []
  const seen = new Set<string>()

  for (const row of root.querySelectorAll("tr")) {
    try {
      const timestamp = extractTimestamp(row)
      if (!timestamp) continue

      const start = new Date(timestamp * 1000)
      if (Number.isNaN(start.getTime())) continue

      const links = row.querySelectorAll("a[href^='/rainbowsix/']").map((anchor) => ({
        text: anchor.getAttribute("title")?.trim() || anchor.text.trim(),
        href: anchor.getAttribute("href") || "",
      }))
      const linkDepth = (href: string) => href.split("/").filter(Boolean).length
      const teamLinks = links.filter((link) => link.text && linkDepth(link.href) === 2)
      const rawOpponent = teamLinks
        .map((link) => link.text)
        .filter((name) => !isOwnTeam(name))
        .pop()
      if (!rawOpponent) continue

      const opponent = resolveDisplayName("r6s", rawOpponent)
      const opponentLogoUrl = resolveLogoUrl("r6s", rawOpponent)
      const cells = row.querySelectorAll("td")
      const tournamentAnchor = links.find((link) => link.text && linkDepth(link.href) > 2)
      const tournament = tournamentAnchor?.text || cells[3]?.text.trim() || cells[2]?.text.trim() || ""
      if (!tournament) continue

      const id = `${TEAM_SLUG}-${timestamp}-${opponent}`
      if (seen.has(id)) continue
      seen.add(id)
      const score = extractScore(row)

      matches.push({
        id,
        team: TEAM_NAME,
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

  for (const card of root.querySelectorAll(".match-info")) {
    try {
      const timestamp = extractTimestamp(card)
      if (!timestamp) continue

      const start = new Date(timestamp * 1000)
      if (Number.isNaN(start.getTime())) continue

      const links = card.querySelectorAll("a[href^='/rainbowsix/']").map((anchor) => ({
        text: anchor.getAttribute("title")?.trim() || anchor.text.trim(),
        href: anchor.getAttribute("href") || "",
      }))
      const linkDepth = (href: string) => href.split("/").filter(Boolean).length
      const rawOpponent = links
        .filter((link) => link.text && linkDepth(link.href) === 2)
        .map((link) => link.text)
        .filter((name) => !isOwnTeam(name))
        .pop()
      if (!rawOpponent) continue

      const opponent = resolveDisplayName("r6s", rawOpponent)
      const opponentLogoUrl = resolveLogoUrl("r6s", rawOpponent)
      const tournamentLink = card
        .querySelectorAll("a[href^='/rainbowsix/']")
        .find((link) => linkDepth(link.getAttribute("href") || "") > 2)
      const tournament = tournamentLink?.text.trim() || tournamentLink?.getAttribute("title")?.trim() || "Rainbow Six Siege"
      const id = `${TEAM_SLUG}-${timestamp}-${opponent}`
      if (seen.has(id)) continue
      seen.add(id)

      matches.push({
        id,
        team: TEAM_NAME,
        opponent,
        ...(opponentLogoUrl ? { opponentLogoUrl } : {}),
        tournament,
        startTime: start.toISOString(),
      })
    } catch {
      continue
    }
  }

  const now = Date.now()
  const past = matches
    .filter((match) => new Date(match.startTime).getTime() < now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const upcoming = matches
    .filter((match) => new Date(match.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return [...past.slice(-MAX_RECENT), ...upcoming.slice(0, MAX_UPCOMING)]
}

export async function GET(request: Request) {
  const blocked = await enforceRateLimit(request, "rainbowsix")
  if (blocked) return blocked

  try {
    const matches = await cachedByKey("rainbowsix:matches", 300_000, scrapeMatches)
    return NextResponse.json(matches, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("[Rainbow Six API] Error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
