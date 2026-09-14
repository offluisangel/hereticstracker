import type { Metadata, Viewport } from "next"
import "./globals.css"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { PageTransition } from "@/components/page-transition"
import { SITE_URL } from "@/lib/site"

const DEFAULT_DESCRIPTION = "Resultados y próximos partidos de Team Heretics."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Heretics Tracker",
  description: DEFAULT_DESCRIPTION,
  icons: [
    {
      rel: "icon",
      url: "/logos/Team_Hereticslogo_220.ico",
    },
    {
      rel: "apple-touch-icon",
      url: "/logos/heretics.png",
    },
  ],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Team Heretics",
    title: "Heretics Tracker",
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [{ url: "/og/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Heretics Tracker",
    description: DEFAULT_DESCRIPTION,
    images: ["/og/og-default.png"],
  },
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
