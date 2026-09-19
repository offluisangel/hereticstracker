import { fetchApiJson } from "@/lib/http-client"

export interface R6SMatch {
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

export async function getR6SMatches(): Promise<R6SMatch[]> {
	try {
		const data = await fetchApiJson<R6SMatch[]>('/api/rainbowsix')
		if (!Array.isArray(data)) throw new Error('Rainbow Six API returned non-array data')
		return data
	} catch (error) {
		console.error('Error fetching Rainbow Six matches:', error)
		return []
	}
}
