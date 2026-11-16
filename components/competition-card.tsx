import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface CompetitionCardProps {
  href: string
  title: string
  description: string
  logoSrc: string
  accent: "lol" | "valorant" | "cod" | "brawl" | "r6s"
  league: string
}

export function CompetitionCard({
  href,
  title,
  description,
  logoSrc,
  accent,
  league,
}: CompetitionCardProps) {
  return (
    <Link href={href} className={`competition-card competition-card--${accent}`}>
      <div className="competition-card__body">
        <div className="competition-card__copy">
          <h3>{title}</h3>
          <span className="competition-card__league">{league}</span>
          <p>{description}</p>
        </div>
        <img className="competition-card__logo" src={logoSrc} alt="" aria-hidden="true" />
      </div>
      <ArrowRight className="competition-card__arrow" size={18} aria-hidden="true" />
    </Link>
  )
}
