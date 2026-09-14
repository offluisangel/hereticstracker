import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Heretics Tracker",
    short_name: "Heretics Tracker",
    description: "Resultados y próximos partidos de Team Heretics.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#050505",
    icons: [
      {
        src: "/logos/Team_Hereticslogo_220.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logos/heretics.png",
        sizes: "672x780",
        type: "image/png",
      },
    ],
  }
}