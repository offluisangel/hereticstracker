import type { Metadata } from "next"
import { TeamTracker } from "@/components/team-tracker"

const path = "/rocketleague"
const title = "Rocket League | Team Heretics"
const description = "Resultados y próximos partidos de Team Heretics en Rocket League."

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

export default function RocketLeaguePage() { return <TeamTracker team="rocketleague" /> }
