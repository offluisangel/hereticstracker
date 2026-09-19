"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const links = [
  { href: "/", label: "Home" },
  { href: "/lol/lec", label: "LEC", accentColor: "#60a5fa" },
  { href: "/lol/les", label: "LES", accentColor: "#60a5fa" },
  { href: "/valorant", label: "Valorant", accentColor: "#f472b6" },
  { href: "/cod", label: "CoD", accentColor: "#fb923c" },
  { href: "/r6s", label: "R6S", accentColor: "#F22E2E" },
  { href: "/brawlstars", label: "Brawl", accentColor: "#f87171" },
]

const brandClass = "font-black uppercase tracking-[-.06em] text-[var(--gold)]"
const activeClass = "text-[var(--gold)]"
const inactiveClass = "text-[var(--muted)]"

export function SiteNavbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="site-navbar">
      <div className="mx-auto flex max-w-[1125px] items-center justify-between px-4 py-4">
        <Link href="/" className={brandClass}>
          Heretics <span className="text-[var(--gold-light)]">Tracker</span>
        </Link>

        <div className="navbar-actions">
          <nav className="hidden gap-1 md:flex" aria-label="Navegación principal">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${pathname === link.href ? activeClass : inactiveClass}`}
                onMouseEnter={(event) => {
                  if (link.accentColor) event.currentTarget.style.color = link.accentColor
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.removeProperty("color")
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="flex items-center justify-center p-2 text-[var(--gold)] md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-[var(--line)] px-4 pb-4 pt-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`px-3 py-3 text-xs font-bold uppercase ${pathname === link.href ? activeClass : "text-[var(--muted)]"}`}
              onMouseEnter={(event) => {
                if (link.accentColor) event.currentTarget.style.color = link.accentColor
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.removeProperty("color")
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
