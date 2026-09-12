export interface ValorantMatch {
  tournament_name: string
  team1: {
    name: string
    logo?: string
  }
  team2: {
    name: string
    logo?: string
  }
  match_datetime: string
  score?: {
    team: number
    opponent: number
  }
}

import { fetchApiJson } from "@/lib/http-client"

export async function getValorantMatches(): Promise<ValorantMatch[]> {
  try {
    const data = await fetchApiJson<ValorantMatch[]>("/api/valorant")
    if (!Array.isArray(data)) {
      throw new Error("Valorant API returned non-array data")
    }
    return data
  } catch (error) {
    console.error("Error fetching Valorant matches:", error)
    return []
  }
}
