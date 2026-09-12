import { fetchApiJson } from "@/lib/http-client"

export interface BrawlStarsMatch {
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

export async function getBrawlStarsMatches(): Promise<BrawlStarsMatch[]> {
  try {
    const data = await fetchApiJson<BrawlStarsMatch[]>("/api/brawlstars")
    if (!Array.isArray(data)) throw new Error("Brawl Stars API returned non-array data")
    return data
  } catch (error) {
    console.error("Error fetching Brawl Stars matches:", error)
    return []
  }
}
