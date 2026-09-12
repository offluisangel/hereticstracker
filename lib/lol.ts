import { fetchApiJson } from "@/lib/http-client"

export interface LolMatch {
  id: string
  team: string
  opponent: string
  opponentLogoUrl?: string
  tournament: string
  startTime: string // ISO string
  score?: {
    team: number
    opponent: number
  }
}

export interface LolData {
  lec: LolMatch[]
  losHeretics: LolMatch[]
}

export async function getLolMatches(): Promise<LolData> {
  try {
    const data = await fetchApiJson<LolData>("/api/lol")
    return data
  } catch (error) {
    console.error("Error fetching LoL matches:", error)
    return { lec: [], losHeretics: [] }
  }
}
