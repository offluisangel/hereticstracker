import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

interface CompetitionCardProps {
  href: string
  game: string
  team: string
  league: string
  logoSrc: string
  accent: string
}

export function CompetitionCard({ href, game, team, league, logoSrc, accent }: CompetitionCardProps) {
  return (
    <Link href={href} className={`competition-card accent--${accent}`}>
      <span className="competition-card__mark">
        <img className="competition-card__logo" src={logoSrc} alt="" width={44} height={44} />
      </span>
      <div className="competition-card__copy">
        <h3>{game}</h3>
        <p>{team}</p>
      </div>
      <span className="competition-card__league">{league}</span>
      <ArrowUpRight className="competition-card__arrow" size={19} aria-hidden="true" />
    </Link>
  )
}
