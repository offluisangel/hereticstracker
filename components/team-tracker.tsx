"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, type Variants } from "framer-motion"
import { getLolMatches } from "@/lib/lol"
import { getValorantMatches, type ValorantMatch } from "@/lib/valorant"
import { getCodMatches } from "@/lib/cod"
import { getBrawlStarsMatches } from "@/lib/brawlstars"
import { getR6SMatches } from "@/lib/r6s"

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
  lec: { game: "League of Legends", league: "LEC", title: "Team Heretics LEC", description: "Resultados y proximos partidos del roster de Team Heretics en la LEC.", logoSrc: "/logos/lollogo.png", loader: async () => normalizeList((await getLolMatches()).lec) },
  les: { game: "League of Legends", league: "LES", title: "Team Heretics LES", description: "Resultados y proximos partidos del equipo de Team Heretics en la LES.", logoSrc: "/logos/lollogo.png", loader: async () => normalizeList((await getLolMatches()).losHeretics) },
  valorant: { game: "Valorant", league: "VCT EMEA", title: "Team Heretics Valorant", description: "Resultados y proximos partidos de Team Heretics en VCT EMEA.", logoSrc: "/logos/vctlogo.png", loader: async () => normalizeValorant(await getValorantMatches()) },
  cod: { game: "Call of Duty", league: "CDL / EWC", title: "Team Heretics CoD", description: "Resultados y proximos partidos de Team Heretics en Call of Duty.", logoSrc: "/logos/thcodlogo.jpg", loader: async () => normalizeList(await getCodMatches()) },
  brawlstars: { game: "Brawl Stars", league: "BSL / BSC", title: "Team Heretics Brawl Stars", description: "Resultados y proximos partidos de Team Heretics en Brawl Stars.", logoSrc: "/logos/bslogo.png", loader: async () => normalizeList(await getBrawlStarsMatches()) },
  r6s: { game: "Rainbow Six Siege", league: "R6S", title: "Team Heretics R6S", description: "Resultados y proximos partidos de Team Heretics en Rainbow Six Siege.", logoSrc: "/logos/r6slogo.png", loader: async () => normalizeList(await getR6SMatches()) },
} satisfies Record<string, TeamConfig>

export function TeamTracker({ team }: { team: keyof typeof configs }) {
  const config = configs[team]
  const [matches, setMatches] = useState<TrackerMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    config.loader().then(setMatches).finally(() => setLoading(false))
  }, [config])

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
          <span className="eyebrow">
            {config.game} / {config.league}
          </span>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <span className="team-mark">
          <img src={config.logoSrc} alt="" aria-hidden="true" />
        </span>
      </header>

      <TrackerSection title="Proximos partidos">
        {loading ? (
          <Empty text="Cargando partidos..." />
        ) : upcoming.length ? (
          <motion.div
            className="upcoming-list"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            <div className="upcoming-table-head" aria-hidden="true">
              <span>Rival</span>
              <span>Fecha y hora</span>
              <span>Torneo</span>
            </div>
            {upcoming.slice(0, 3).map((m) => (
              <MatchRow key={m.id} match={m} upcoming />
            ))}
          </motion.div>
        ) : (
          <Empty text="No hay partidos proximos programados." />
        )}
      </TrackerSection>

      <TrackerSection title="Resultados recientes">
        {loading ? (
          <Empty text="Cargando resultados..." />
        ) : recent.length ? (
          <motion.div
            className="match-list"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            <div className="match-table-head" aria-hidden="true">
              <span>Rival</span>
              <span>Marcador</span>
              <span>Resultado</span>
              <span>Torneo</span>
              <span>Fecha</span>
            </div>
            {recent.slice(0, 10).map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </motion.div>
        ) : (
          <Empty text="No hay resultados disponibles." />
        )}
      </TrackerSection>
    </main>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="empty-match">{text}</div>
}

function TrackerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="tracker-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <span />
      </div>
      {children}
    </section>
  )
}

function MatchRow({ match, upcoming }: { match: TrackerMatch; upcoming?: boolean }) {
  if (upcoming) {
    return (
      <motion.div className="match-row upcoming-row" variants={rowVariants}>
        <div className="opponent-cell">
          {match.opponentLogoUrl && (
            <div className="opponent-logo">
              <img src={match.opponentLogoUrl} alt="" loading="lazy" />
            </div>
          )}
          <strong>{match.opponent}</strong>
        </div>
        <time className="upcoming-date" dateTime={match.date}>{formatDateTime(match.date)}</time>
        <div className="match-tournament">{match.tournament}</div>
      </motion.div>
    )
  }

  return (
    <motion.div className="match-row" variants={rowVariants}>
      <div className="opponent-cell">
        {match.opponentLogoUrl && (
          <div className="opponent-logo">
            <img src={match.opponentLogoUrl} alt="" loading="lazy" />
          </div>
        )}
        <strong>
          {match.opponent}
        </strong>
      </div>
      <strong className="match-score">{match.score}</strong>
      <div className={`result result-${match.result.toLowerCase()}`}>
        {match.result === "W" ? "Victoria" : match.result === "L" ? "Derrota" : "-"}
      </div>
      <div className="match-tournament">{match.tournament}</div>
      <time>{formatDate(match.date)}</time>
    </motion.div>
  )
}