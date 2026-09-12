import { NextResponse } from "next/server"
import { parse, type HTMLElement } from "node-html-parser"
import { cachedByKey } from "@/lib/api-cache"
import { enforceRateLimit } from "@/lib/rate-limit"
import { resolveLogoUrl } from "@/lib/logos"

export const runtime = "nodejs"
export const revalidate = 300

interface ValorantMatch {
  tournament_name: string
  team1: { name: string; logo?: string }
  team2: { name: string; logo?: string }
  match_datetime: string
  score?: {
    team: number
    opponent: number
  }
}

// Selectores frágiles ante cambios de HTML en VLR.gg.
const SELECTORS = {
  matchItem: "a.wf-card.fc-flex.m-item",
  event: ".m-item-event",
  teamName: ".m-item-team-name",
  result: ".m-item-result",
  date: ".m-item-date",
  utcTs: "[data-utc-ts]",
}

const extractScore = (item: HTMLElement) => {
  const values = item
    .querySelector(SELECTORS.result)
    ?.querySelectorAll("span")
    .map((span) => Number(span.text.trim()))
    .filter((value) => Number.isInteger(value))

  return values?.length === 2 ? { team: values[0], opponent: values[1] } : undefined
}

const VLR_BASE = "https://www.vlr.gg"
const TEAM_ID = 1001
const TEAM_SLUG = "team-heretics"
const TEAM_NAME = "Team Heretics"
const TEAM_MATCHES_URL = `${VLR_BASE}/team/matches/${TEAM_ID}/${TEAM_SLUG}/`
const USER_AGENT =
  process.env.VLR_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

const MAX_UPCOMING_MATCHES = 3
const MAX_RECENT_MATCHES = 10

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 300 },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

// "2026-09-26 05:00:00" (UTC) -> Date
const parseUtcTs = (value: string): Date | null => {
  const normalized = value.trim()
  const dated = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(normalized)
    ? normalized.replace(" ", "T")
    : normalized
  const iso = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dated) ? dated : `${dated}Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

// Fallback
const parseLegacyDate = (text: string): Date | null => {
  const match = text.match(
    /(\d{4})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})\s*(am|pm)?/i
  )
  if (!match) return null
  const [, year, month, day, rawHour, minute, meridiem] = match
  let hour = Number(rawHour)
  if (meridiem) {
    if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12
    if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0
  }
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), hour, Number(minute))
  )
  return Number.isNaN(date.getTime()) ? null : date
}

const extractTournament = (item: HTMLElement): string => {
  const eventEl = item.querySelector(SELECTORS.event)
  const titleEl = eventEl?.querySelector("div")
  return titleEl?.text.trim() || eventEl?.text.trim() || ""
}

const extractOpponent = (item: HTMLElement): string => {
  const teamNames = (item.querySelectorAll(SELECTORS.teamName) ?? [])
    .map((el) => el.text.trim())
    .filter(Boolean)
  const opponent = teamNames.find((name) => !name.toLowerCase().includes("heretics"))
  return opponent || teamNames[teamNames.length - 1] || "TBA"
}

const fetchMatchStart = async (
  item: HTMLElement,
  href: string
): Promise<{ start: Date | null; source: "utc" | "fallback" }> => {
  try {
    const response = await fetchWithTimeout(`${VLR_BASE}${href}`, 8000)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const html = await response.text()
    const root = parse(html)
    const tsEl = root.querySelector(SELECTORS.utcTs)
    const raw = tsEl?.getAttribute("data-utc-ts")
    if (raw) {
      const start = parseUtcTs(raw)
      if (start) return { start, source: "utc" }
    }
  } catch (error) {
    console.error("[Valorant API] Error obteniendo hora del partido:", href, error)
  }

  const fallback = parseLegacyDate(item.querySelector(SELECTORS.date)?.text || "")
  return { start: fallback, source: "fallback" }
}

async function scrapeUpcomingMatches(): Promise<ValorantMatch[]> {
  const response = await fetchWithTimeout(TEAM_MATCHES_URL, 8000)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} en ${TEAM_MATCHES_URL}`)
  }
  const html = await response.text()
  const root = parse(html)

  const matchItems = root.querySelectorAll(SELECTORS.matchItem)
  console.log(`[Valorant API] ${matchItems.length} partidos encontrados en VLR.gg`)

  const matches: ValorantMatch[] = []

  for (const item of matchItems) {
    const href = item.getAttribute("href") || ""
    const tournament = extractTournament(item)
    const opponent = extractOpponent(item)
    const score = extractScore(item)
    const { start } = await fetchMatchStart(item, href)

    if (!start) {
      console.warn(`[Valorant API] Sin fecha para ${href}`)
      continue
    }

    matches.push({
      tournament_name: tournament,
      team1: { name: TEAM_NAME },
      team2: { name: opponent, ...(resolveLogoUrl("vct", opponent) ? { logo: resolveLogoUrl("vct", opponent) } : {}) },
      match_datetime: start.toISOString(),
      ...(score ? { score } : {}),
    })
  }

  const now = Date.now()
  const past = matches
    .filter((match) => new Date(match.match_datetime).getTime() < now)
    .sort((a, b) => new Date(a.match_datetime).getTime() - new Date(b.match_datetime).getTime())
  const upcoming = matches
    .filter((match) => new Date(match.match_datetime).getTime() >= now)
    .sort((a, b) => new Date(a.match_datetime).getTime() - new Date(b.match_datetime).getTime())

  return [...past.slice(-MAX_RECENT_MATCHES), ...upcoming.slice(0, MAX_UPCOMING_MATCHES)]
}

const CACHE_TTL_MS = 300_000

export async function GET(request: Request) {
  const blocked = await enforceRateLimit(request, "valorant")
  if (blocked) return blocked

  try {
    const matches = await cachedByKey("valorant:matches", CACHE_TTL_MS, scrapeUpcomingMatches)
    return NextResponse.json(matches, {
      headers: {
        "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[Valorant API] Error en GET handler:", error)
    return NextResponse.json([], { status: 200 })
  }
}
