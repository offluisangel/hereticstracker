import { fetchApiJson } from "@/lib/http-client"

export interface CodMatch {
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

export async function getCodMatches(): Promise<CodMatch[]> {
  try {
    const data = await fetchApiJson<CodMatch[]>("/api/cod")
    if (!Array.isArray(data)) throw new Error("CoD API returned non-array data")
    return data
  } catch (error) {
    console.error("Error fetching CoD matches:", error)
    return []
  }
}
