export type LeagueKey = "lec" | "les" | "vct" | "cdl" | "brawl"

interface TeamRecord {
  aliases: string[]
  logo?: string
  displayName?: string
}

// Alias normalizados (lowercase, sin caracteres especiales) que usa Liquipedia/VLR/LES
// para reconocer a cada equipo. Suele incluir el nombre completo ("g2esports") y
// las siglas ("g2"), porque el key del mapa es un id corto y no siempre coincide
// con lo que devuelve la fuente.
const TEAMS: Record<LeagueKey, Record<string, TeamRecord>> = {
  lec: {
    fnatic: { aliases: ["fn", "fnc", "fnatic"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Fnatic.webp?v=1786482647551", displayName: "Fnatic" },
    g2: { aliases: ["g2", "g2esports"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/G2%20Esports.webp?v=1786482652843", displayName: "G2" },
    giant: { aliases: ["gx", "giantx"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/GIANTX.webp?v=1786482768991", displayName: "Giantx" },
    kc: { aliases: ["kc", "karminecorp"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Karmine%20Corp.webp?v=1786482830243", displayName: "Karmine Corp" },
    koi: { aliases: ["koi", "movistarkoi", "movistarkoiesports"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Movistar%20KOI.webp?v=1786482905989", displayName: "Movistar Koi" },
    navi: { aliases: ["navi", "nv", "natusvincere"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Natus%20Vincere.webp?v=1786483077131", displayName: "Natus Vincere" },
    sk: { aliases: ["sk", "skgaming"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/SK%20Gaming.webp?v=1786482986591", displayName: "SK Gaming" },
    shifters: { aliases: ["shft", "shifters"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Shifters.webp?v=1786483053260", displayName: "Shifters" },
    heretics: { aliases: ["th", "heretics", "teamheretics"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Team%20Heretics.webp?v=1786482993764", displayName: "Team Heretics" },
    vitality: { aliases: ["vit", "vitality", "teamvitality"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Team%20Vitality.webp?v=1786482891937", displayName: "Team Vitality" },
  },
  les: {
    koi: { aliases: ["koi", "mkf", "movistarkoi", "movistarkoiesports"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/MKF.png", displayName: "MOVISTAR KOI FENIX" },
    ucam: { aliases: ["ucam", "ucamurcia"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/UCAM.png", displayName: "UCAM ESPORTS" },
    heretics: { aliases: ["hrts", "losheretics", "lh", "heretics", "teamheretics", "th"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/HRTS.png", displayName: "HERETICS ACADEMY" },
    barca: { aliases: ["bar", "barcelona", "fcbarcelona", "barca"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/BAR.png", displayName: "BARCA ESPORTS" },
    giant: { aliases: ["gx", "giantx"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/GX.png", displayName: "GIANTX ITERO" },
    lua: { aliases: ["lua"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/LUA.png", displayName: "LUA GAMING" },
    falke: { aliases: ["flk", "falke"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/FLK.png", displayName: "FALKE ESPORTS" },
    ub: { aliases: ["ub", "udb"], logo: "https://static.lesesports.es/teams/SPLIT3-2026/UB.png", displayName: "UNIVERSITAT DE BARCELONA" },
  },
  vct: {
    bbl: { aliases: ["bbl", "bblesports"], logo: "https://owcdn.net/img/65b8ccef5e273.png" },
    kc: { aliases: ["kc", "karminecorp"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Karmine%20Corp.webp?v=1786482830243" },
    vitality: { aliases: ["vit", "vitality", "teamvitality"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Team%20Vitality.webp?v=1786482891937" },
    navi: { aliases: ["navi", "natusvincere", "nv"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Natus%20Vincere.webp?v=1786483077131" },
    fnatic: { aliases: ["fn", "fnc", "fnatic"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Fnatic.webp?v=1786482647551" },
    heretics: { aliases: ["th", "heretics", "teamheretics"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Team%20Heretics.webp?v=1786482993764" },
    teamliquid: { aliases: ["tl", "teamliquid", "liquid"], logo: "https://owcdn.net/img/640c38262824c.png" },
    giant: { aliases: ["gx", "giantx"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/GIANTX.webp?v=1786482768991" },
    fut: { aliases: ["fut", "futesports"], logo: "https://owcdn.net/img/632be99c96c64.png" },
    eternalfire: { aliases: ["ef", "eternalfire", "eternal"], logo: "https://owcdn.net/img/6628980dcdaea.png" },
    gentlemates: { aliases: ["gm", "gentlemates"], logo: "https://owcdn.net/img/66701546055dd.png" },
  },
  cdl: {
    ravens: { aliases: ["ravens", "car", "carolinaroyalravens"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/bltc1ddba2549587194/64f74317af49494ad8926c37/ravens-icon-color.svg?auto=webp", displayName: "Carolina Royal Ravens" },
    c9: { aliases: ["c9", "c9ny", "cloud9", "ny", "cloud9newyork"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt73e8f6f2194e9370/6719383cef12165a22bf678c/C9NY_Icon_White_NY_(1).svg?auto=webp", displayName: "Cloud9 New York" },
    faze: { aliases: ["faze", "fazeclan", "atlantafaze"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/bltdea71ea67a2999d7/68cc24e4e6f87a2d6e27a6c6/Asset_14.svg?auto=webp", displayName: "Atlanta FaZe" },
    rokkr: { aliases: ["rokkr", "minnesota", "g2minnesota", "g2", "minnesotarokkr"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt8f87f7107e1658cc/6732a3d2ac6f71ab1c541288/ROKKR_ICON_MAIN_Red_(1).svg?auto=webp", displayName: "Minnesota Røkkr" },
    optic: { aliases: ["optic", "opt", "optictexas", "tx", "texas"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt4bee833057845797/618af2431bb8c23cf8bbede5/cdl_optic_texas_icon_light.svg?auto=webp", displayName: "OpTic Texas" },
    heretics: { aliases: ["th", "heretics", "teamheretics", "miamiheretics", "mk"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt46e2a57928dfcb39/64e77a7ff3415dce8124716b/heretics-icon-color.svg?auto=webp", displayName: "Miami Heretics" },
    m80: { aliases: ["m80", "boston", "m80boston", "bos", "bostonbreach"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt43e23375d6f06170/6a9860657ec8fec56d0004a7/M80Boston_Logo_(2).svg?auto=webp", displayName: "M80 Boston" },
    thieves: { aliases: ["thieves", "lathieves", "thievesgaming"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt4ae7c1816b4ffc52/5fa5a10ea9e913483b74d191/cdl_la_thieves_primary_logo_padding.svg?auto=webp", displayName: "LA Thieves" },
    gentlemates: { aliases: ["m8", "m8paris", "par", "parisgentlemates", "gentlemates", "paris"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt68118b0f6e452b79/6925d17d521fe6a55224502c/Paris_Gentle_Mates_block.svg?auto=webp", displayName: "Paris Gentle Mates" },
    falcons: { aliases: ["flcn", "ryd", "riyadhfalcons", "teamfalcons", "falcons", "riyadh"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt10cfdbbd775958c4/68c05db642e3074f5b293148/Riyadh_Falcons_Mark_Green_Icon_No_Crop.svg?auto=webp", displayName: "Team Falcons" },
    koi: { aliases: ["tor", "torontokoi", "koi", "movistarkoi", "movistarkoiesports"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/blt7cfe2b2dd1a274d5/690b774337ded4045fe74dfa/koi_frame_(1).svg?auto=webp", displayName: "Toronto Koi" },
    surge: { aliases: ["surge", "seattlesurge", "seattle", "van", "vancouversurge"], logo: "https://images.blz-contentstack.com/v3/assets/blta7b34f1f894a2422/bltbe8507a1cef478bb/5dba15def9bc554996993cd0/SEA_-_Surge.svg?auto=webp", displayName: "Vancouver Surge" },
  },
  brawl: {
    navi: { aliases: ["navi", "nv", "natusvincere"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/Natus%20Vincere.webp?v=1786483077131", displayName: "Natus Vincere" },
    sk: { aliases: ["sk", "skgaming"], logo: "https://tabgg.sfo3.cdn.digitaloceanspaces.com/medias/teams-color/SK%20Gaming.webp?v=1786482986591", displayName: "SK Gaming" },
  },
}

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

interface TeamMatch {
  id: string
  displayName?: string
  logo?: string
}

function findTeam(league: LeagueKey, rawName: string): TeamMatch | undefined {
  const key = normalizeKey(rawName)
  const teams = TEAMS[league]
  if (!teams) return undefined

  for (const [id, record] of Object.entries(teams)) {
    if (id === key || record.aliases.some((alias) => alias === key)) {
      return { id, ...record }
    }
  }
  for (const [id, record] of Object.entries(teams)) {
    if (record.aliases.some((alias) => key.includes(alias))) {
      return { id, ...record }
    }
  }
  return undefined
}

export const resolveLogoUrl = (league: LeagueKey, opponentName: string): string | undefined =>
  findTeam(league, opponentName)?.logo

export const resolveDisplayName = (league: LeagueKey, name: string): string =>
  findTeam(league, name)?.displayName ?? name