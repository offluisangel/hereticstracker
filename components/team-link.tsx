"use client"

import Link from "next/link"
import { useEffect, useRef, type ComponentProps } from "react"
import { fetchApiJson } from "@/lib/http-client"
import { teamMatchEndpoints } from "@/lib/team-match-endpoints"

const HOVER_DELAY_MS = 120

type TeamLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string }

export function TeamLink({ href, ...props }: TeamLinkProps) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endpoint = teamMatchEndpoints.get(href)

  useEffect(() => () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current)
  }, [href])

  function cancelHover() {
    if (hoverTimer.current === null) return
    clearTimeout(hoverTimer.current)
    hoverTimer.current = null
  }

  function prefetchMatches() {
    // An unvisited team's error must not surface; navigation owns retries and feedback.
    if (endpoint) void fetchApiJson(endpoint).catch(() => {})
  }

  return (
    <Link
      {...props}
      href={href}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" && endpoint) {
          cancelHover()
          hoverTimer.current = setTimeout(() => {
            hoverTimer.current = null
            prefetchMatches()
          }, HOVER_DELAY_MS)
        }
        props.onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        cancelHover()
        props.onPointerLeave?.(event)
      }}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) prefetchMatches()
        props.onFocus?.(event)
      }}
    />
  )
}
