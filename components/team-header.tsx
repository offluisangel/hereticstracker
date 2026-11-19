interface TeamHeaderProps {
  context: string
  title: string
  description?: string
  logoSrc?: string
  logoClassName?: string
}

export function TeamHeader({ context, title, description, logoSrc, logoClassName }: TeamHeaderProps) {
  return (
    <header className="team-header">
      <div>
        <h1>{title}</h1>
        <p className="team-context">{context}</p>
        {description ? <p>{description}</p> : null}
      </div>
      <span className={`team-mark ${logoClassName ?? ""}`} aria-hidden="true">
        {logoSrc ? <img src={logoSrc} alt="" width={144} height={144} /> : "TH"}
      </span>
    </header>
  )
}
