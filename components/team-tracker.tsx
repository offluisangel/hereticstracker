"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { fetchApiJson } from "@/lib/http-client"
import type { ValorantMatch } from "@/lib/valorant"

type TrackerMatch = {
  id: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  date: string
  score: string
  result: "W" | "L" | "-"
}

type TeamConfig = {
  game: string
  league: string
  title: string
  description: string
  logoSrc: string
  loader: () => Promise<TrackerMatch[]>
}

// Forma común que devuelven los endpoints de LoL, CoD y Brawl Stars.
type SourceMatch = {
  id: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  startTime: string
  score?: { team: number; opponent: number }
}

const EASE = [0.16, 1, 0.3, 1] as const

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value))

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const resultFor = (score?: { team: number; opponent: number }): TrackerMatch["result"] =>
  !score ? "-" : score.team > score.opponent ? "W" : "L"

const toTrackerMatch = (m: SourceMatch): TrackerMatch => ({
  id: m.id,
  opponent: m.opponent,
  opponentLogoUrl: m.opponentLogoUrl,
  tournament: m.tournament,
  date: m.startTime,
  score: m.score ? `${m.score.team}-${m.score.opponent}` : "Por definir",
  result: resultFor(m.score),
})

const normalizeList = (matches: SourceMatch[]): TrackerMatch[] => matches.map(toTrackerMatch)

const normalizeValorant = (matches: ValorantMatch[]): TrackerMatch[] =>
  matches.map((m, i) => {
    const isHeretics = m.team1.name === "Team Heretics"
    return {
      id: `${m.match_datetime}-${i}`,
      opponent: isHeretics ? m.team2.name : m.team1.name,
      opponentLogoUrl: isHeretics ? m.team2.logo : m.team1.logo,
      tournament: m.tournament_name,
      date: m.match_datetime,
      score: m.score ? `${m.score.team}-${m.score.opponent}` : "Por definir",
      result: resultFor(m.score),
    }
  })

const configs = {
  lec: { game: "League of Legends", league: "LEC", title: "Team Heretics LEC", description: "Resultados y próximos partidos del roster de Team Heretics en la LEC.", logoSrc: "/logos/lollogo.png", loader: async () => normalizeList((await fetchApiJson<{ lec: SourceMatch[] }>("/api/lol")).lec) },
  valorant: { game: "Valorant", league: "VCT EMEA", title: "Team Heretics Valorant", description: "Resultados y próximos partidos de Team Heretics en VCT EMEA.", logoSrc: "/logos/vctlogo.png", loader: async () => normalizeValorant(await fetchApiJson<ValorantMatch[]>("/api/valorant")) },
  cod: { game: "Call of Duty", league: "CDL / EWC", title: "Team Heretics CoD", description: "Resultados y próximos partidos de Team Heretics en Call of Duty.", logoSrc: "/logos/thcodlogo.jpg", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>("/api/cod")) },
  brawlstars: { game: "Brawl Stars", league: "BSL / BSC", title: "Team Heretics Brawl Stars", description: "Resultados y próximos partidos de Team Heretics en Brawl Stars.", logoSrc: "/logos/bslogo.png", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>("/api/brawlstars")) },
  r6s: { game: "Rainbow Six Siege", league: "R6S", title: "Team Heretics R6S", description: "Resultados y próximos partidos de Team Heretics en Rainbow Six Siege.", logoSrc: "/logos/r6slogo.png", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>("/api/rainbowsix")) },
  rocketleague: { game: "Rocket League", league: "Rocket League", title: "Team Heretics Rocket League", description: "Resultados y próximos partidos de Team Heretics en Rocket League.", logoSrc: "/logos/rl-logo.png", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>("/api/rocketleague")) }
} satisfies Record<string, TeamConfig>

export function TeamTracker({ team }: { team: keyof typeof configs }) {
  const config = configs[team]
  const [matches, setMatches] = useState<TrackerMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    config.loader()
      .then((data) => { if (active) setMatches(data) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [config, attempt])

  const { upcoming, recent } = useMemo(() => {
    const now = Date.now()
    return {
      upcoming: matches
        .filter((m) => new Date(m.date).getTime() > now)
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),
      recent: matches
        .filter((m) => new Date(m.date).getTime() <= now)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    }
  }, [matches])

  return (
    <main className={`tracker-shell team-tracker team-tracker--${team}`}>
      <header className="team-header">
        <div>
          <h1>{config.title}</h1>
          <p className="team-context">{config.game} / {config.league}</p>
          <p>{config.description}</p>
        </div>
        <span className="team-mark">
          <img src={config.logoSrc} alt="" aria-hidden="true" />
        </span>
      </header>

      {error ? (
        <div className="tracker-error" role="alert">
          <div>
            <h2>No se pudieron cargar los partidos.</h2>
            <p>Comprueba tu conexión y vuelve a intentarlo.</p>
          </div>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>Reintentar</button>
        </div>
      ) : (
        <>
          <TrackerSection title="Próximos partidos" loading={loading}>
            {loading ? <Empty text="Cargando partidos..." /> : upcoming.length ? (
              <div className="upcoming-list">
                <table className="match-table upcoming-table">
                  <caption className="sr-only">Próximos partidos de {config.title}</caption>
                  <thead>
                    <tr><th scope="col">Rival</th><th scope="col">Fecha y hora</th><th scope="col">Torneo</th></tr>
                  </thead>
                  <motion.tbody variants={listVariants} initial={reduceMotion ? false : "hidden"} animate="show">
                    {upcoming.slice(0, 3).map((m) => <MatchRow key={m.id} match={m} upcoming />)}
                  </motion.tbody>
                </table>
              </div>
            ) : <Empty text="No hay partidos próximos programados." />}
          </TrackerSection>

          <TrackerSection title="Resultados recientes" loading={loading}>
            {loading ? <Empty text="Cargando resultados..." /> : recent.length ? (
              <div className="match-list">
                <table className="match-table recent-table">
                  <caption className="sr-only">Resultados recientes de {config.title}</caption>
                  <thead>
                    <tr><th scope="col">Rival</th><th scope="col">Marcador</th><th scope="col">Resultado</th><th scope="col">Torneo</th><th scope="col">Fecha</th></tr>
                  </thead>
                  <motion.tbody variants={listVariants} initial={reduceMotion ? false : "hidden"} animate="show">
                    {recent.slice(0, 10).map((m) => <MatchRow key={m.id} match={m} />)}
                  </motion.tbody>
                </table>
              </div>
            ) : <Empty text="No hay resultados disponibles." />}
          </TrackerSection>
        </>
      )}
    </main>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="empty-match" role="status">{text}</div>
}

function TrackerSection({ title, children, loading }: { title: string; children: React.ReactNode; loading: boolean }) {
  return (
    <section className="tracker-section" aria-busy={loading}>
      <div className="section-heading">
        <h2>{title}</h2>
        <span aria-hidden="true" />
      </div>
      {children}
    </section>
  )
}

function MatchRow({ match, upcoming }: { match: TrackerMatch; upcoming?: boolean }) {
  if (upcoming) {
    return (
      <motion.tr className="match-row upcoming-row" variants={rowVariants}>
        <td>
          <div className="opponent-cell">
          {match.opponentLogoUrl && (
            <div className="opponent-logo">
              <img src={match.opponentLogoUrl} alt="" loading="lazy" />
            </div>
          )}
            <strong>{match.opponent}</strong>
          </div>
        </td>
        <td><time className="upcoming-date" dateTime={match.date}>{formatDateTime(match.date)}</time></td>
        <td className="match-tournament">{match.tournament}</td>
      </motion.tr>
    )
  }

  return (
    <motion.tr className="match-row" variants={rowVariants}>
      <td>
        <div className="opponent-cell">
        {match.opponentLogoUrl && (
          <div className="opponent-logo">
            <img src={match.opponentLogoUrl} alt="" loading="lazy" />
          </div>
        )}
          <strong>{match.opponent}</strong>
        </div>
      </td>
      <td className="match-score">{match.score}</td>
      <td>
        <span className={`result result-${match.result.toLowerCase()}`}>
          {match.result === "W" ? "Victoria" : match.result === "L" ? "Derrota" : "-"}
        </span>
      </td>
      <td className="match-tournament">{match.tournament}</td>
      <td><time dateTime={match.date}>{formatDate(match.date)}</time></td>
    </motion.tr>
  )
}