"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Check, Menu, X } from "lucide-react"
import { useRef, useState } from "react"
import { TeamLink } from "@/components/team-link"

const links = [
  { href: "/", label: "Inicio" },
  { href: "/lol/lec", label: "LEC" },
  { href: "/valorant", label: "Valorant" },
  { href: "/cod", label: "CoD" },
  { href: "/brawlstars", label: "Brawl Stars" },
  { href: "/r6s", label: "Rainbow Six" },
]

export function SiteNavbar() {
  const pathname = usePathname()
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const open = menuPath === pathname

  const renderLinks = (mobile = false) => links.map(({ href, label }) => (
    <li key={href}>
      <TeamLink
        href={href}
        aria-current={pathname === href ? "page" : undefined}
        onClick={mobile ? () => {
          if (href === pathname) toggle.current?.focus()
          setMenuPath(null)
        } : undefined}
        className="navbar-link"
      >
        {label}
        {mobile && pathname === href ? <Check size={16} aria-hidden="true" /> : null}
      </TeamLink>
    </li>
  ))

  return (
    <>
      <a className="skip-link" href="#main-content">Ir al contenido</a>
      <header
        className="site-navbar"
        onBlur={(event) => {
          if (open && !event.currentTarget.contains(event.relatedTarget)) setMenuPath(null)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault()
            setMenuPath(null)
            toggle.current?.focus()
          }
        }}
      >
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand" onClick={() => setMenuPath(null)}>
            <img src="/logos/heretics.png" alt="" width={30} height={30} />
            <span>Heretics <strong>Tracker</strong></span>
          </Link>
          <nav className="navbar-desktop" aria-label="Navegación principal">
            <ul>{renderLinks()}</ul>
          </nav>
          <button
            ref={toggle}
            type="button"
            className="navbar-toggle"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setMenuPath(open ? null : pathname)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
          <nav id="mobile-navigation" aria-label="Navegación móvil" className="navbar-mobile" hidden={!open}>
            <ul>{renderLinks(true)}</ul>
          </nav>
        </div>
      </header>
    </>
  )
}
