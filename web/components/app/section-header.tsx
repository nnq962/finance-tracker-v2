import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"
import type * as React from "react"

/**
 * A section's title on a dashboard-like page: larger and in the text colour,
 * as in native apps, with an optional note and a "see all" link at the end.
 * Lists that read like settings keep SettingsGroup's small grey caption.
 */
export function SectionHeader({
  title,
  note,
  href,
  linkLabel = "Xem tất cả",
  action,
}: {
  title: React.ReactNode
  /** Short grey text after the title, e.g. the period. */
  note?: React.ReactNode
  href?: string
  linkLabel?: string
  /** A control in place of the link. */
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-1">
      <h2 className="flex min-w-0 items-baseline gap-2 text-xl font-medium">
        <span className="truncate">{title}</span>
        {note ? <span className="shrink-0 text-sm font-normal text-muted-foreground">{note}</span> : null}
      </h2>
      {action ??
        (href ? (
          <Link
            href={href}
            className="flex min-h-11 shrink-0 items-center text-sm text-muted-foreground transition-colors hover:text-foreground active:opacity-60"
          >
            {linkLabel}
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Link>
        ) : null)}
    </div>
  )
}
