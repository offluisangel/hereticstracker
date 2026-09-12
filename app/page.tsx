import type { Metadata } from "next"
import { CompetitionCard } from "@/components/competition-card"
import { TeamHeader } from "@/components/team-header"
import { TeamPrefetch } from "@/components/team-prefetch"

export const metadata: Metadata = {
  title: "Team Heretics | Match tracker",
  description:
    "Resultados y próximos partidos de Team Heretics en League of Legends (LEC y LES), Valorant (VCT EMEA) y Call of Duty (CDL + EWC).",
}

const competitions = [
  {
    href: "/lol/lec",
    league: "League of Legends / LEC",
    accent: "lol" as const,
    logoSrc: "/logos/lollogo.png",
    eyebrow: "League of Legends / LEC",
    accentColor: "#60a5fa",
    title: "Team Heretics",
    description: "Resultados y próximos partidos de Team Heretics en la LEC.",
  },
  {
    href: "/lol/les",
    league: "LES",
    accent: "lol" as const,
    logoSrc: "/logos/lollogo.png",
    eyebrow: "League of Legends / LES + EMEA",
    accentColor: "#60a5fa",
    title: "Heretics Academy",
    description: "Resultados y próximos partidos de Team Heretics en la LES.",
  },
  {
    href: "/valorant",
    league: "Valorant / VCT EMEA",
    accent: "valorant" as const,
    logoSrc: "/logos/vctlogo.png",
    eyebrow: "Valorant / VCT EMEA",
    accentColor: "#f472b6",
    title: "Heretics valorant",
    description: "Resultados y próximos partidos de Team Heretics en VCT.",
  },
  {
    href: "/cod",
    league: "Call of Duty / CDL + EWC",
    accent: "cod" as const,
    logoSrc: "/logos/cdllogo.png",
    eyebrow: "Call of Duty / CDL + EWC",
    accentColor: "#fb923c",
    title: "Miami Heretics",
    description: "Resultados y próximos partidos de Team Heretics en Call of Duty.",
  },
  {
    href: "/brawlstars",
    league: "Brawl Stars / BSL + BSC",
    accent: "brawl" as const,
    logoSrc: "/logos/bslogo.png",
    eyebrow: "Brawl Stars / BSL + BSC",
    accentColor: "#f87171",
    title: "Team Heretics BS",
    description: "Resultados y próximos partidos de Team Heretics en Brawl Stars.",
  },
]

export default function HomePage() {
  return (
    <main className="tracker-shell">
      <TeamHeader
        eyebrow="Team Heretics / Match tracker"
        logoSrc="/logos/heretics.png"
        logoClassName="home-mark"
        title="Resultados y próximos partidos"
      />

      <section className="tracker-section">
        <div className="section-heading">
          <h2>Equipos &amp; competiciones</h2>
          <span aria-hidden="true" />
        </div>
        <div className="competition-grid">
          {competitions.map((competition) => (
            <CompetitionCard key={competition.href} {...competition} />
          ))}
        </div>
      </section>
      <TeamPrefetch />
    </main>
  )
}
