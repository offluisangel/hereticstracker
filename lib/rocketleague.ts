import { fetchApiJson } from "@/lib/http-client"

export interface RocketLeagueMatch {
  id: string
  team: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  startTime: string
  score?: {
    team: number
    opponent: number
  }
}

export async function getRocketLeagueMatches(): Promise<RocketLeagueMatch[]> {
  try {
    const data = await fetchApiJson<RocketLeagueMatch[]>("/api/rocketleague")
    if (!Array.isArray(data)) throw new Error("Rocket League API returned non-array data")
    return data
  } catch (error) {
    console.error("Error fetching Rocket League matches:", error)
    return []
  }
}
