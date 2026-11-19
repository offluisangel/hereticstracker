import type { Metadata } from "next"
import { CompetitionCard } from "@/components/competition-card"
import { TeamHeader } from "@/components/team-header"

export const metadata: Metadata = {
  title: "Team Heretics | Match tracker",
  description:
    "Resultados y próximos partidos de Team Heretics en League of Legends, Valorant, Call of Duty, Brawl Stars, Rainbow Six Siege y Rocket League.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Team Heretics | Match tracker",
    description:
      "Resultados y próximos partidos de Team Heretics en League of Legends, Valorant, Call of Duty, Brawl Stars, Rainbow Six Siege y Rocket League.",
    url: "/",
    images: [{ url: "/og/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Team Heretics | Match tracker",
    description:
      "Resultados y próximos partidos de Team Heretics en League of Legends, Valorant, Call of Duty, Brawl Stars, Rainbow Six Siege y Rocket League.",
    images: ["/og/og-default.png"],
  },
}

const competitions = [
  { href: "/lol/lec", game: "League of Legends", team: "Team Heretics", league: "LEC", accent: "lec", logoSrc: "/logos/lollogo.png" },
  { href: "/valorant", game: "Valorant", team: "Team Heretics", league: "VCT EMEA", accent: "valorant", logoSrc: "/logos/vctlogo.png" },
  { href: "/cod", game: "Call of Duty", team: "Miami Heretics", league: "CDL / EWC", accent: "cod", logoSrc: "/logos/cdllogo.png" },
  { href: "/brawlstars", game: "Brawl Stars", team: "Team Heretics BS", league: "BSL / BSC", accent: "brawlstars", logoSrc: "/logos/bslogo.png" },
  { href: "/r6s", game: "Rainbow Six Siege", team: "Team Heretics", league: "R6S", accent: "r6s", logoSrc: "/logos/r6slogo.png" },
  { href: "/rocketleague", game: "Rocket League", team: "Team Heretics", league: "Rocket League", accent: "rocketleague", logoSrc: "/logos/rl-logo.png" },
]

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1} className="tracker-shell home-shell">
      <TeamHeader
        context="Team Heretics / Esports"
        logoSrc="/logos/heretics.png"
        logoClassName="home-mark"
        title="Resultados y próximos partidos"
      />

      <section className="tracker-section" aria-labelledby="competitions-title">
        <div className="section-heading">
          <h2 id="competitions-title">Equipos y competiciones</h2>
          <span aria-hidden="true" />
        </div>
        <ul className="competition-directory">
          {competitions.map((competition) => (
            <li key={competition.href}><CompetitionCard {...competition} /></li>
          ))}
        </ul>
      </section>
    </main>
  )
}
