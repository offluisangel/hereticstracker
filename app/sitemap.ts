import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/lol/lec", "/lol/les", "/valorant", "/cod", "/brawlstars"]
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }))
}