import Link from "next/link"
import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Two to four figures side by side, split by thin lines: the figure above,
 * a small grey label below, e.g. the parts of a total. Each can open a page.
 * `separated`: a line above too, set off from the lead figure over it. On an
 * inverse card the lines and labels turn light.
 */
export function StatGroup({
  separated = false,
  className,
  children,
}: {
  separated?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-slot="stat-group"
      className={cn(
        "grid auto-cols-fr grid-flow-col divide-x group-data-[variant=inverse]/card:divide-inverse-foreground/15",
        separated && "border-t pt-5 group-data-[variant=inverse]/card:border-inverse-foreground/15",
        className,
      )}
    >
      {children}
    </div>
  )
}

type StatProps = {
  /** The figure: plain text or a Money. */
  value: React.ReactNode
  label: React.ReactNode
  /**
   * The page the figure is about; the stat becomes a link. Prefer it to
   * onClick for opening a page: a link works before the page's script has
   * loaded and is prefetched, so the first tap is never lost.
   */
  href?: string
  /** Does something in place; the stat becomes a button. */
  onClick?: () => void
  /** The full figure for the tooltip and screen readers when `value` is shortened. */
  title?: string
}

export function Stat({ value, label, href, onClick, title }: StatProps) {
  const content = (
    <>
      <span className="truncate font-semibold tabular-nums">{value}</span>
      <span className="truncate text-xs text-muted-foreground group-data-[variant=inverse]/card:text-inverse-foreground/60">
        {label}
      </span>
    </>
  )
  const className = "flex min-h-11 min-w-0 flex-col justify-center text-left not-first:pl-4"

  const pressable = {
    title,
    "aria-label": title ? `${label}: ${title}` : undefined,
    className: cn(className, "pressable outline-none focus-visible:ring-3 focus-visible:ring-ring/30"),
  }

  if (href) {
    return (
      <Link href={href} {...pressable}>
        {content}
      </Link>
    )
  }

  return onClick ? (
    <button type="button" onClick={onClick} {...pressable}>
      {content}
    </button>
  ) : (
    <div title={title} className={className}>
      {content}
    </div>
  )
}
