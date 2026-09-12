interface TeamHeaderProps {
  eyebrow: string
  title: string
  description?: string
  logoSrc?: string
  logoClassName?: string
}

export function TeamHeader({ eyebrow, title, description, logoSrc, logoClassName }: TeamHeaderProps) {
  return (
    <header className="team-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <span className={`team-mark ${logoClassName ?? ""}`} aria-hidden="true">
        {logoSrc ? <img src={logoSrc} alt="" /> : "TH"}
      </span>
    </header>
  )
}
