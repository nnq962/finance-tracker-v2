"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * Folds its content away and back, its height (or width, `axis="x"`)
 * sliding between nothing and what the content needs while it fades, so what
 * comes after moves up smoothly instead of jumping: the transactions page
 * making way for its search, the search's Huỷ sliding in, a group folded
 * under its caption. Closed, the content stays mounted, so it opens without
 * reloading, but is inert: out of the tab order and of what screen readers
 * read.
 *
 * Rebuilt on `motion` (2026-10-21; a CSS transition on grid-template-rows
 * stuttered on iOS Safari): the size animates to the measured "auto" and
 * turns back mid-way when tapped again; 250ms, 150ms when motion is reduced.
 * Shadows: nothing is clipped while it rests open, so the shadows of the
 * cards and buttons inside show whole; while it moves, or rests closed, only
 * the edge it grows from is cut, at its box (the content is still being
 * revealed there, and fading), never the shadows above or beside.
 */
export function Collapse({
  open,
  axis = "y",
  className,
  contentClassName,
  children,
}: {
  open: boolean
  axis?: "x" | "y"
  className?: string
  /** On the box inside, e.g. `lg:contents` where the fold only applies to phones. */
  contentClassName?: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const [moving, setMoving] = React.useState(false)
  const size = axis === "y" ? "height" : "width"
  const edge = axis === "y" ? "inset(-48px -48px 0px -48px)" : "inset(-48px 0px -48px -48px)"

  return (
    <motion.div
      data-slot="collapse"
      data-state={open ? "open" : "closed"}
      inert={!open}
      initial={false}
      animate={{ [size]: open ? "auto" : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.25, ease: [0.2, 0, 0, 1] }}
      onAnimationStart={() => setMoving(true)}
      onAnimationComplete={() => setMoving(false)}
      // Margins set by the open state (e.g. a gap that closes with it) ease with the size.
      className={cn("transition-[margin] duration-250 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:duration-150", className)}
      style={{ clipPath: moving || !open ? edge : "none" }}
    >
      {/* Across, the content keeps its own width while the box narrows to nothing. */}
      {/* flow-root keeps the content's own margins inside (2026-10-21): while the height is set
          they stay in, once it is auto again they collapsed through it, so the fold ended with a
          jump of that margin (the header's 16 below it as the search screen closed). */}
      <div data-state={open ? "open" : "closed"} className={cn("flow-root", axis === "x" && "w-max", contentClassName)}>
        {children}
      </div>
    </motion.div>
  )
}
