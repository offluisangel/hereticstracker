import type { Metadata, Viewport } from "next"
import "./globals.css"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { PageTransition } from "@/components/page-transition"

export const metadata: Metadata = { title: "Heretics Tracker", description: "Resultados y próximos partidos de Team Heretics.",
  icons: [
    {
      rel: "icon",
      url: "/logos/Team_Hereticslogo_220.ico",
    },
  ],
}
export const viewport: Viewport = { themeColor: "#050505" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-[var(--black)]">
      <body className="site-body">
        <SiteNavbar />
        <PageTransition>{children}</PageTransition>
        <SiteFooter />
      </body>
    </html>
  )
}
