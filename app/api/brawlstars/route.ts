import { NextResponse } from "next/server"
import { parse, type HTMLElement } from "node-html-parser"
import { cachedByKey } from "@/lib/api-cache"
import { enforceRateLimit } from "@/lib/rate-limit"
import { resolveLogoUrl, type LeagueKey } from "@/lib/logos"

export const runtime = "nodejs"
export const revalidate = 300

export interface BrawlStarsMatch {
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

const LIQUIPEDIA_BASE = "https://liquipedia.net/brawlstars"
const TEAM_SLUG = "Team_Heretics"
const TEAM_NAME = "Team Heretics"
const MAX_UPCOMING = 3
const MAX_RECENT = 10

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

const isOwnTeam = (text: string) => {
  const n = normalizeName(text)
  return n.includes("heretics") || n === "th" || n === "teamheretics"
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const userAgent = process.env.LIQUIPEDIA_UA || "HereticsTrackerBot/1.0"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Api-User-Agent": userAgent,
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
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

async function scrapeMatches(): Promise<BrawlStarsMatch[]> {
  const apiUrl = `${LIQUIPEDIA_BASE}/api.php?action=parse&page=${TEAM_SLUG}&prop=text&format=json&origin=*&redirects=1`

  const response = await fetchWithTimeout(apiUrl, 10000)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const json = (await response.json()) as { parse?: { text?: { "*"?: string } } }
  const html = json.parse?.text?.["*"]
  if (!html) return []

  const root = parse(html)
  const matches: BrawlStarsMatch[] = []
  const seen = new Set<string>()

  const rows = root.querySelectorAll("tr")

  for (const row of rows) {
    try {
      const timestamp = extractTimestamp(row)
      if (!timestamp) continue

      const start = new Date(timestamp * 1000)
      if (Number.isNaN(start.getTime())) continue

      const cells = row.querySelectorAll("td")
      if (cells.length < 6) continue

      const opponentCell = cells[cells.length - 1]
      const teamLinks = opponentCell.querySelectorAll("a[href^='/brawlstars/']")
        .filter((a) => {
          const href = a.getAttribute("href") || ""
          return !href.includes("index.php") && !a.classList.contains("new")
        })

      if (teamLinks.length === 0) continue

      const opponentAnchor = teamLinks[teamLinks.length - 1]
      const opponent = opponentAnchor.getAttribute("title")?.trim() || opponentAnchor.text.trim()
      if (!opponent || isOwnTeam(opponent)) continue
      const opponentLogoUrl = resolveLogoUrl("brawl", opponent)

      const tournament = cells[3]?.querySelector("a")?.text.trim() || cells[3]?.text.trim() || ""
      if (!tournament) continue

      const scoreCell = cells[5]
      const scoreText = (scoreCell?.text || "").replace(/\u00A0/g, " ").trim()
      const scoreParts = scoreText.split(":").map((s) => s.trim())
      const score =
        scoreParts.length === 2 && scoreParts.every((v) => /^\d+$/.test(v))
          ? { team: Number(scoreParts[0]), opponent: Number(scoreParts[1]) }
          : scoreParts.length === 2 && scoreParts.includes("FF") && scoreParts.includes("W")
            ? scoreParts[0] === "W"
              ? { team: 1, opponent: 0 }
              : { team: 0, opponent: 1 }
            : undefined

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

      const links = card.querySelectorAll("a[href^='/brawlstars/']").map((anchor) => ({
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

      const opponent = rawOpponent
      const opponentLogoUrl = resolveLogoUrl("brawl", rawOpponent)
      const tournamentLink = links.find((link) => link.text && linkDepth(link.href) > 2)
      const tournament = tournamentLink?.text || "Brawl Stars"
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
    .filter((m) => new Date(m.startTime).getTime() < now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  const upcoming = matches
    .filter((m) => new Date(m.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return [...past.slice(-MAX_RECENT), ...upcoming.slice(0, MAX_UPCOMING)]
}

const CACHE_TTL_MS = 300_000

export async function GET(request: Request) {
  const blocked = await enforceRateLimit(request, "brawlstars")
  if (blocked) return blocked

  try {
    const matches = await cachedByKey("brawlstars:matches", CACHE_TTL_MS, scrapeMatches)
    return NextResponse.json(matches, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("[BrawlStars API] Error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
