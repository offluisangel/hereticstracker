"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, CircleAlert, ClipboardList, LoaderCircle, RotateCw } from "lucide-react"
import { TeamHeader } from "@/components/team-header"
import { fetchApiJson } from "@/lib/http-client"
import { teamMatchUrls } from "@/lib/team-match-endpoints"
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
  lec: { game: "League of Legends", league: "LEC", title: "Team Heretics LEC", description: "Resultados y próximos partidos del roster de Team Heretics en la LEC.", logoSrc: "/logos/lollogo.png", loader: async () => normalizeList((await fetchApiJson<{ lec: SourceMatch[] }>(teamMatchUrls.lec)).lec) },
  valorant: { game: "Valorant", league: "VCT EMEA", title: "Team Heretics Valorant", description: "Resultados y próximos partidos de Team Heretics en VCT EMEA.", logoSrc: "/logos/vctlogo.png", loader: async () => normalizeValorant(await fetchApiJson<ValorantMatch[]>(teamMatchUrls.valorant)) },
  cod: { game: "Call of Duty", league: "CDL / EWC", title: "Team Heretics CoD", description: "Resultados y próximos partidos de Team Heretics en Call of Duty.", logoSrc: "/logos/thcodlogo.jpg", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>(teamMatchUrls.cod)) },
  brawlstars: { game: "Brawl Stars", league: "BSL / BSC", title: "Team Heretics Brawl Stars", description: "Resultados y próximos partidos de Team Heretics en Brawl Stars.", logoSrc: "/logos/bslogo.png", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>(teamMatchUrls.brawlstars)) },
  r6s: { game: "Rainbow Six Siege", league: "R6S", title: "Team Heretics R6S", description: "Resultados y próximos partidos de Team Heretics en Rainbow Six Siege.", logoSrc: "/logos/r6slogo.png", loader: async () => normalizeList(await fetchApiJson<SourceMatch[]>(teamMatchUrls.r6s)) },
} satisfies Record<string, TeamConfig>

export function TeamTracker({ team }: { team: keyof typeof configs }) {
  const config = configs[team]
  const [matches, setMatches] = useState<TrackerMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const main = useRef<HTMLElement>(null)

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
    <main id="main-content" ref={main} tabIndex={-1} className={`tracker-shell team-tracker accent--${team}`}>
      <TeamHeader
        context={`${config.game} / ${config.league}`}
        title={config.title}
        description={config.description}
        logoSrc={config.logoSrc}
        logoClassName={team === "cod" ? "team-mark--cod" : undefined}
      />
      <p className="sr-only" role="status">
        {loading ? "Cargando partidos y resultados…" : error ? "" : "Partidos y resultados actualizados."}
      </p>

      {error ? (
        <div className="tracker-error">
          <CircleAlert size={22} aria-hidden="true" />
          <div role="alert">
            <h2>No se pudieron cargar los partidos.</h2>
            <p>Comprueba tu conexión y vuelve a intentarlo.</p>
          </div>
          <button type="button" onClick={() => {
            main.current?.focus()
            setAttempt((value) => value + 1)
          }}><RotateCw size={16} aria-hidden="true" /> Reintentar</button>
        </div>
      ) : (
        <>
          <TrackerSection id="upcoming" title="Próximos partidos" loading={loading}>
            {loading ? <Empty text="Cargando partidos…" loading /> : upcoming.length ? (
              <div className="upcoming-list">
                <table className="match-table upcoming-table">
                  <caption className="sr-only">Próximos partidos de {config.title}</caption>
                  <thead>
                    <tr><th scope="col">Rival</th><th scope="col">Fecha y hora</th><th scope="col">Torneo</th></tr>
                  </thead>
                  <tbody>
                    {upcoming.slice(0, 3).map((m, index) => <MatchRow key={m.id} match={m} upcoming next={index === 0} />)}
                  </tbody>
                </table>
              </div>
            ) : <Empty text="No hay partidos próximos programados." upcoming />}
          </TrackerSection>

          <TrackerSection id="recent" title="Resultados recientes" loading={loading}>
            {loading ? <Empty text="Cargando resultados…" loading /> : recent.length ? (
              <div className="match-list">
                <table className="match-table recent-table">
                  <caption className="sr-only">Resultados recientes de {config.title}</caption>
                  <thead>
                    <tr><th scope="col">Rival</th><th scope="col">Marcador</th><th scope="col">Resultado</th><th scope="col">Torneo</th><th scope="col">Fecha</th></tr>
                  </thead>
                  <tbody>
                    {recent.slice(0, 10).map((m) => <MatchRow key={m.id} match={m} />)}
                  </tbody>
                </table>
              </div>
            ) : <Empty text="No hay resultados disponibles." />}
          </TrackerSection>
        </>
      )}
    </main>
  )
}

function Empty({ text, loading = false, upcoming = false }: { text: string; loading?: boolean; upcoming?: boolean }) {
  const Icon = loading ? LoaderCircle : upcoming ? CalendarDays : ClipboardList
  return (
    <div className="empty-match">
      <Icon size={19} className={loading ? "loading-icon" : undefined} aria-hidden="true" />
      <p>{text}</p>
    </div>
  )
}

function TrackerSection({ id, title, children, loading }: { id: string; title: string; children: React.ReactNode; loading: boolean }) {
  return (
    <section className="tracker-section" aria-labelledby={`${id}-title`} aria-busy={loading}>
      <div className="section-heading">
        <h2 id={`${id}-title`}>{title}</h2>
        <span aria-hidden="true" />
      </div>
      {children}
    </section>
  )
}

function MatchRow({ match, upcoming, next }: { match: TrackerMatch; upcoming?: boolean; next?: boolean }) {
  return (
    <tr className={`match-row${upcoming ? " upcoming-row" : ""}`}>
      <td>
        <div className="opponent-cell">
          {match.opponentLogoUrl && (
            <div className="opponent-logo">
              <img src={match.opponentLogoUrl} alt="" loading="lazy" width={32} height={32} />
            </div>
          )}
          <div>
            {next ? <span className="match-next">Siguiente partido</span> : null}
            <strong>{match.opponent}</strong>
          </div>
        </div>
      </td>
      {upcoming ? (
        <>
          <td><time className="upcoming-date" dateTime={match.date}>{formatDateTime(match.date)}</time></td>
          <td className="match-tournament">{match.tournament}</td>
        </>
      ) : (
        <>
          <td className={`match-score${match.result === "-" ? " match-score--pending" : ""}`}>{match.score}</td>
          <td>
            <span className={`result result-${match.result.toLowerCase()}`}>
              {match.result === "W" ? "Victoria" : match.result === "L" ? "Derrota" : "Sin resultado"}
            </span>
          </td>
          <td className="match-tournament">{match.tournament}</td>
          <td><time dateTime={match.date}>{formatDate(match.date)}</time></td>
        </>
      )}
    </tr>
  )
}
