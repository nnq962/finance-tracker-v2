"use client"

import * as React from "react"
import { Trash2Icon, type LucideIcon } from "lucide-react"
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

const ACTION_WIDTH = 88

/**
 * A list row that slides left to reveal one action behind it (delete by
 * default), as in iOS lists. The action is also reachable with Tab, which
 * opens the row. Used through SettingsRow's `swipeAction`, so swipeable rows
 * look like every other list row; the list's card clips the corners.
 */
export function SwipeRow({
  children,
  onAction,
  actionLabel = "Xoá",
  actionIcon: ActionIcon = Trash2Icon,
  className,
}: {
  children: React.ReactNode
  onAction: () => void
  actionLabel?: string
  actionIcon?: LucideIcon
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const reduceMotion = useReducedMotion()
  const x = useMotionValue(0)
  // The red layer shows only once the row moves, so no red edge peeks out
  // around the rounded corners at rest.
  const actionOpacity = useTransform(x, [-12, 0], [1, 0])
  const dragged = React.useRef(false)

  return (
    <div data-slot="swipe-row" className={cn("relative overflow-hidden", className)}>
      <motion.div aria-hidden="true" style={{ opacity: actionOpacity }} className="absolute inset-0 bg-destructive" />
      <motion.button
        type="button"
        onClick={onAction}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{ width: ACTION_WIDTH, opacity: actionOpacity }}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 text-xs font-medium text-white outline-none focus-visible:underline"
      >
        <ActionIcon className="size-5" />
        {actionLabel}
      </motion.button>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.08}
        animate={{ x: open ? -ACTION_WIDTH : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.4 }}
        // Touch drags often end without a click, so the flag resets on the next press.
        onPointerDownCapture={() => {
          dragged.current = false
        }}
        onDragStart={() => {
          dragged.current = true
        }}
        onDragEnd={(_, info) => setOpen(info.offset.x < -ACTION_WIDTH / 2 || info.velocity.x < -400)}
        // A drag is not a tap on the row, and a tap on an open row only closes it.
        onClickCapture={(event) => {
          if (dragged.current || open) {
            event.preventDefault()
            event.stopPropagation()
            if (!dragged.current) setOpen(false)
          }
        }}
        style={{ x, touchAction: "pan-y" }}
        className="relative bg-card"
      >
        {children}
      </motion.div>
    </div>
  )
}
