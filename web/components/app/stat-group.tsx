import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Two to four figures side by side, split by thin lines: the figure above,
 * a small grey label below, e.g. the parts of a total. Each can open a page.
 */
export function StatGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div data-slot="stat-group" className={cn("grid auto-cols-fr grid-flow-col divide-x", className)}>
      {children}
    </div>
  )
}

type StatProps = {
  /** The figure: plain text or a Money. */
  value: React.ReactNode
  label: React.ReactNode
  /** Opens what the figure is about; the stat becomes a button. */
  onClick?: () => void
  /** The full figure for the tooltip and screen readers when `value` is shortened. */
  title?: string
}

export function Stat({ value, label, onClick, title }: StatProps) {
  const content = (
    <>
      <span className="truncate font-medium tabular-nums">{value}</span>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
    </>
  )
  const className = "flex min-h-11 min-w-0 flex-col justify-center text-left not-first:pl-4"

  return onClick ? (
    <button
      type="button"
      title={title}
      aria-label={title ? `${label}: ${title}` : undefined}
      onClick={onClick}
      className={cn(className, "pressable outline-none focus-visible:ring-3 focus-visible:ring-ring/30")}
    >
      {content}
    </button>
  ) : (
    <div title={title} className={className}>
      {content}
    </div>
  )
}
