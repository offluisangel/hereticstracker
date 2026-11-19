import { NextResponse } from "next/server"
import { parse } from "node-html-parser"
import { cachedByKey } from "@/lib/api-cache"
import { enforceRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"
export const revalidate = 300

export interface RocketLeagueMatch {
  id: string
  team: string
  opponent: string
  tournament: string
  startTime: string
  score?: {
    team: number
    opponent: number
  }
}

const LIQUIPEDIA_BASE = "https://liquipedia.net/rocketleague"
const TEAM_SLUG = "Team_Heretics"
const CACHE_TTL_MS = 300_000

async function scrapeMatches(): Promise<RocketLeagueMatch[]> {
  const userAgent = process.env.LIQUIPEDIA_UA || "HereticsTrackerBot/1.0"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `${LIQUIPEDIA_BASE}/api.php?action=parse&page=${TEAM_SLUG}&prop=text&format=json&origin=*&redirects=1`,
      {
        headers: {
          "User-Agent": userAgent,
          "Api-User-Agent": userAgent,
          Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
          Referer: `${LIQUIPEDIA_BASE}/${TEAM_SLUG}`,
        },
        next: { revalidate: 300 },
        signal: controller.signal,
      },
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const json = (await response.json()) as { parse?: { text?: { "*"?: string } } }
    const html = json.parse?.text?.["*"]
    if (!html) return []

    const root = parse(html)
    const matches: RocketLeagueMatch[] = []
    const seen = new Set<string>()

    for (const row of root.querySelectorAll("tr")) {
      const cells = row.querySelectorAll("td")
      if (cells.length < 6) continue

      const time = row.querySelector(".timer-object, [data-timestamp], [data-sort-value], [datetime]")
      const rawTimestamp =
        time?.getAttribute("data-timestamp") ||
        time?.getAttribute("data-timestamp-ms") ||
        time?.getAttribute("data-sort-value") ||
        time?.getAttribute("datetime")
      if (!rawTimestamp || rawTimestamp === "error") continue

      const numericTimestamp = /^\d+$/.test(rawTimestamp) ? Number(rawTimestamp) : Number.NaN
      const date = Number.isFinite(numericTimestamp)
        ? new Date(numericTimestamp < 10_000_000_000 ? numericTimestamp * 1000 : numericTimestamp)
        : new Date(rawTimestamp)
      if (Number.isNaN(date.getTime())) continue

      const opponentCell = cells[cells.length - 1]
      const opponentAnchor = opponentCell
        .querySelectorAll("a[href^='/rocketleague/']")
        .filter((anchor) => {
          const href = anchor.getAttribute("href") || ""
          const name = anchor.getAttribute("title")?.trim() || anchor.text.trim()
          return !href.includes("index.php") && !anchor.classList.contains("new") && name.length > 0 && !/heretics/i.test(name)
        })
        .pop()
      const opponent = opponentAnchor?.getAttribute("title")?.trim() || opponentAnchor?.text.trim()
      if (!opponent) continue

      const tournament = cells[3]?.querySelector("a")?.text.trim() || cells[3]?.text.trim() || ""
      if (!tournament) continue

      const scoreText = (cells[5]?.text || "").replace(/\u00a0/g, " ").trim()
      const scoreParts = scoreText.split(":").map((part) => part.trim())
      const score =
        scoreParts.length === 2 && scoreParts.every((part) => /^\d+$/.test(part))
          ? { team: Number(scoreParts[0]), opponent: Number(scoreParts[1]) }
          : undefined
      const id = `${TEAM_SLUG}-${date.getTime()}-${opponent}`
      if (seen.has(id)) continue
      seen.add(id)

      matches.push({ id, team: "Team Heretics", opponent, tournament, startTime: date.toISOString(), ...(score ? { score } : {}) })
    }

    const now = Date.now()
    const past = matches.filter((match) => Date.parse(match.startTime) <= now).sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    const upcoming = matches.filter((match) => Date.parse(match.startTime) > now).sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    return [...past.slice(-10), ...upcoming.slice(0, 3)]
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(request: Request) {
  const blocked = await enforceRateLimit(request, "rocketleague")
  if (blocked) return blocked

  try {
    const matches = await cachedByKey("rocketleague:matches", CACHE_TTL_MS, scrapeMatches)
    return NextResponse.json(matches, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("[Rocket League API] Error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
