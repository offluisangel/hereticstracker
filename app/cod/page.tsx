import type { Metadata } from "next"
import { TeamTracker } from "@/components/team-tracker"

const path = "/cod"
const title = "Call of Duty CDL + EWC | Team Heretics"
const description =
  "Resultados y próximos partidos de Miami Heretics (Team Heretics) en Call of Duty (CDL + EWC)."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title,
    description,
    url: path,
    images: [{ url: "/og/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    title,
    description,
    images: ["/og/og-default.png"],
  },
}

export default function CodPage() { return <TeamTracker team="cod" /> }