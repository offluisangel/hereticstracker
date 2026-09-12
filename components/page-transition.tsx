"use client"

import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

const EASE = [0.16, 1, 0.3, 1] as const

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="min-h-[60vh]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: EASE }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}