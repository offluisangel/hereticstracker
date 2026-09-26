import { NextResponse } from "next/server"
import { parse, type HTMLElement } from "node-html-parser"
import { cachedByKey } from "@/lib/api-cache"
import { enforceRateLimit } from "@/lib/rate-limit"
import { resolveDisplayName, resolveLogoUrl, type LeagueKey } from "@/lib/logos"

export const runtime = "nodejs"

interface LolMatch {
  id: string
  team: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  startTime: string // ISO string
  score?: {
    team: number
    opponent: number
  }
}

// Liquipedia usa dos estructuras distintas para partidos:
//   - "table2" (historial) -> filas <tr>
//   - "Upcoming Matches"   -> tarjetas .match-info
const SELECTORS = {
  rows: "tr",
  cards: ".match-info",
  timer: ".timer-object",
  teamLink: "a[href^='/leagueoflegends/']",
  cardOpponentRow: ".match-info-opponent-row",
  cardTournament: ".match-info-tournament-name",
  cardScore: ".match-info-opponent-score",
}

const LIQUIPEDIA_BASE = "https://liquipedia.net/leagueoflegends"

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

const extractTeamFromHref = (href: string) => {
  const base = href.split("#")[0].split("?")[0]
  const segment = base.split("/").filter(Boolean).pop() || ""
  return segment.replace(/_/g, " ")
}

const linkDepth = (href: string) => href.split("/").filter(Boolean).length

const isSameTeam = (candidate: string, teamName: string, teamSlug: string) => {
  const n = normalizeName(candidate)
  const slugNorm = normalizeName(teamSlug)
  const slugSpaced = normalizeName(teamSlug.replace(/_/g, " "))
  const nameNorm = normalizeName(teamName)
  const initials = normalizeName(teamName.split(/\s+/).map((w) => w[0]).join(""))
  const variants = new Set([
    nameNorm,
    slugNorm,
    slugSpaced,
    initials,
    "th",
    "teamheretics",
    "lh",
    "losheretics",
    "heretics",
    "hrts",
  ])
  return variants.has(n) || n.includes("heretics")
}

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const userAgent =
    process.env.LIQUIPEDIA_UA ||
    "HereticsTrackerBot/1.0 (configura LIQUIPEDIA_UA en el entorno)"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const pageUrl = `${LIQUIPEDIA_BASE}/${url.split("page=")[1]?.split("&")[0] ?? ""}`
    return await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        "Api-User-Agent": userAgent,
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Referer: pageUrl,
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
): Promise<LolMatch[]> {
  const apiUrl = `${LIQUIPEDIA_BASE}/api.php?action=parse&page=${encodeURIComponent(teamSlug)}&prop=text&format=json&origin=*&redirects=1`

  try {
    let response = await fetchWithTimeout(apiUrl, 8000)
    if (!response.ok) {
      response = await fetchWithTimeout(apiUrl, 8000)
    }

    if (!response.ok) {
      console.error(`[LoL API] Error HTTP ${response.status} para ${teamSlug}`)
      throw new Error(`HTTP ${response.status}`)
    }

    const json = (await response.json()) as {
      parse?: { text?: { "*"?: string } }
    }
    const html = json?.parse?.text?.["*"]
    if (!html) {
      console.warn(`[LoL API] HTML vacío para ${teamSlug}`)
      return []
    }

    const root = parse(html)
    const matches: LolMatch[] = []
    const seen = new Set<string>()

    const maybeAdd = (entry: LolMatch) => {
      if (seen.has(entry.id)) return
      seen.add(entry.id)
      matches.push(entry)
    }

    const rows = root.querySelectorAll(SELECTORS.rows)

    for (const row of rows) {
      try {
        const timer = row.querySelector(SELECTORS.timer)
        const ts = timer?.getAttribute("data-timestamp")
        if (!ts) continue

        const start = new Date(Number(ts) * 1000)
        if (Number.isNaN(start.getTime())) continue

        const anchored = row.querySelectorAll(SELECTORS.teamLink).map((a) => ({
          text: a.text.trim(),
          href: a.getAttribute("href") || "",
        }))

        const tournamentAnchor = anchored.find(
          (a) => a.text && linkDepth(a.href) > 2
        )
        const tournamentFromLink = tournamentAnchor?.text || ""

        const teamLike = anchored.filter(
          (a) =>
            a.text &&
            linkDepth(a.href) === 2 &&
            a.text !== "View match details" &&
            !a.href.includes(":") &&
            !/_tournaments$/i.test(a.href) &&
            !/tier$/i.test(a.text)
        )

        const opponentByLink = teamLike
          .filter(
            (a) =>
              !isSameTeam(a.text, teamName, teamSlug) &&
              !isSameTeam(extractTeamFromHref(a.href), teamName, teamSlug)
          )
          .pop()

        const rawOpponent = opponentByLink?.text.trim() ?? ""
        const opponent = rawOpponent ? resolveDisplayName(league, rawOpponent) : ""
        if (!opponent || isSameTeam(opponent, teamName, teamSlug)) continue
        const opponentLogoUrl = resolveLogoUrl(league, rawOpponent)

        const cells = row.querySelectorAll("td")
        const scoreValues = (cells[5]?.text || "")
          .trim()
          .split(":")
          .map((value) => Number(value.trim()))
        const score = scoreValues.length === 2 && scoreValues.every((value) => Number.isInteger(value))
          ? { team: scoreValues[0], opponent: scoreValues[1] }
          : undefined
        const tournament =
          tournamentFromLink ||
          cells[3]?.text?.trim() ||
          cells[2]?.text?.trim() ||
          ""

        if (!tournament) continue

        maybeAdd({
          id: `${teamSlug}-${ts}-${opponent}`,
          team: teamName,
          opponent: opponent || extractTeamFromHref(opponentByLink?.href || "TBD"),
          ...(opponentLogoUrl ? { opponentLogoUrl } : {}),
          tournament,
          startTime: start.toISOString(),
          ...(score ? { score } : {}),
        })
      } catch {
        continue
      }
    }

    for (const card of root.querySelectorAll(SELECTORS.cards)) {
      try {
        const ts = card.querySelector(SELECTORS.timer)?.getAttribute("data-timestamp")
        if (!ts) continue

        const start = new Date(Number(ts) * 1000)
        if (Number.isNaN(start.getTime())) continue

        const rowNames = card
          .querySelectorAll(SELECTORS.cardOpponentRow)
          .map((row) => {
            const anchor = row.querySelector(SELECTORS.teamLink) || row.querySelector(".name")
            return anchor?.getAttribute("title")?.trim() || anchor?.text.trim() || ""
          })
          .filter(Boolean)

        let rawOpponent = rowNames.filter((n) => !isSameTeam(n, teamName, teamSlug)).pop()

        // Fallback
        if (!rawOpponent) {
          rawOpponent = card
            .querySelectorAll(SELECTORS.teamLink)
            .map((a) => ({
              text: a.getAttribute("title")?.trim() || a.text.trim(),
              href: a.getAttribute("href") || "",
            }))
            .filter((l) => l.text && linkDepth(l.href) === 2)
            .map((l) => l.text)
            .filter((n) => !isSameTeam(n, teamName, teamSlug))
            .pop()
        }
        if (!rawOpponent) continue

        const opponent = resolveDisplayName(league, rawOpponent)
        if (!opponent || isSameTeam(opponent, teamName, teamSlug)) continue
        const opponentLogoUrl = resolveLogoUrl(league, rawOpponent)

        const tournament =
          card.querySelector(SELECTORS.cardTournament)?.text.trim() ||
          card
            .querySelectorAll(SELECTORS.teamLink)
            .find((a) => linkDepth(a.getAttribute("href") || "") > 2)
            ?.getAttribute("title")
            ?.trim() ||
          ""

        const scoreCells = card.querySelectorAll(SELECTORS.cardScore).map((el) => el.text.trim())
        const score =
          scoreCells.length === 2 && scoreCells.every((value) => /^\d+$/.test(value))
            ? { team: Number(scoreCells[0]), opponent: Number(scoreCells[1]) }
            : undefined

        maybeAdd({
          id: `${teamSlug}-${ts}-${opponent}`,
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

    const now = Date.now()
    const past = matches
      .filter((m) => new Date(m.startTime).getTime() < now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    const upcoming = matches
      .filter((m) => new Date(m.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3)
    const sorted = [...past.slice(-10), ...upcoming]

    console.log(`[LoL API] ${sorted.length} partidos normalizados para ${teamSlug}`)
    return sorted
  } catch (error) {
    console.error(`[LoL API] Error scraping ${teamSlug}:`, error)
    return []
  }
}

export const revalidate = 300 // ISR: revalidate cada 5 minutos

const CACHE_TTL_MS = 300_000

export async function GET(request: Request) {
  const blocked = await enforceRateLimit(request, "lol")
  if (blocked) return blocked

  try {
    const data = await cachedByKey("lol:matches", CACHE_TTL_MS, async () => {
      const [lecMatches, losHereticsMatches] = await Promise.all([
        scrapeTeamMatches("Team_Heretics", "Team Heretics", "lec"),
        scrapeTeamMatches("Los_Heretics", "Los Heretics", "les"),
      ])
      console.log(
        `[LoL API] Obtenidos ${lecMatches.length} partidos LEC y ${losHereticsMatches.length} partidos Los Heretics`
      )
      return { lec: lecMatches, losHeretics: losHereticsMatches }
    })

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[LoL API] Error en GET handler:", error)
    return NextResponse.json({ lec: [], losHeretics: [] }, { status: 200 })
  }
}
