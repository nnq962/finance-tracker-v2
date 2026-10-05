import type * as React from "react"
import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  /** For aria-labelledby on the section. */
  id?: string
  title: React.ReactNode
  /** A muted note after the title, e.g. the month shown. */
  note?: React.ReactNode
  /** Where "see all" goes; or pass `action` for a control of its own. */
  href?: string
  hrefLabel?: string
  action?: React.ReactNode
  className?: string
}

/**
 * A dashboard section's title, large and dark as in the minimal design, with
 * an optional link or control at the end. Lists of settings keep the small
 * grey caption of SettingsGroup instead.
 */
export function SectionHeader({ id, title, note, href, hrefLabel = "Xem tất cả", action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex min-h-8 items-center justify-between gap-3 px-1", className)}>
      <h2 id={id} className="min-w-0 truncate text-lg font-semibold tracking-tight">
        {title}
        {note ? <span className="ml-1.5 text-[15px] font-normal tracking-normal text-muted-foreground">{note}</span> : null}
      </h2>
      {href ? (
        <Link
          href={href}
          className="-mr-1 flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {hrefLabel}
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        action
      )}
    </div>
  )
}
