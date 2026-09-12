"use client"

import { useEffect } from "react"
import { getLolMatches } from "@/lib/lol"
import { getValorantMatches } from "@/lib/valorant"
import { getCodMatches } from "@/lib/cod"
import { getBrawlStarsMatches } from "@/lib/brawlstars"

export function TeamPrefetch() {
  useEffect(() => {
    void getLolMatches()
    void getValorantMatches()
    void getCodMatches()
    void getBrawlStarsMatches()
  }, [])

  return null
}