export const teamMatchUrls = {
  lec: "/api/lol",
  valorant: "/api/valorant",
  cod: "/api/cod",
  brawlstars: "/api/brawlstars",
  r6s: "/api/rainbowsix",
} as const

export const teamMatchEndpoints: ReadonlyMap<string, string> = new Map([
  ["/lol/lec", teamMatchUrls.lec],
  ["/valorant", teamMatchUrls.valorant],
  ["/cod", teamMatchUrls.cod],
  ["/brawlstars", teamMatchUrls.brawlstars],
  ["/r6s", teamMatchUrls.r6s],
])
