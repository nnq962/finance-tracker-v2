import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: React.ReactNode
  /** Short grey text after the title, e.g. the period. */
  note?: React.ReactNode
  href?: string
  linkLabel?: string
  /** A control in place of the link. */
  action?: React.ReactNode
}

/**
 * A section's title on a dashboard-like page: larger and in the text colour,
 * as in native apps, with an optional note and a "see all ›" link at the end.
 * Lists that read like settings keep SettingsGroup's small grey caption.
 * Pages use it through Section, which spaces the content below.
 */
export function SectionHeader({
  id,
  title,
  note,
  href,
  linkLabel = "Xem tất cả",
  action,
}: SectionHeaderProps & { id?: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-1">
      <h2 id={id} className="flex min-w-0 items-baseline gap-2 text-base font-semibold">
        <span className="truncate">{title}</span>
        {note ? <span className="shrink-0 text-sm font-normal text-muted-foreground">{note}</span> : null}
      </h2>
      {action ??
        (href ? (
          // Darker than the grey notes and with a chevron, as in iOS, so it reads
          // as something to tap rather than a faint web link.
          <Link
            href={href}
            className="flex min-h-11 shrink-0 items-center gap-0.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground active:opacity-60"
          >
            {linkLabel}
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Link>
        ) : null)}
    </div>
  )
}

/**
 * A titled section of a page: its SectionHeader, then the content 8px below
 * and the pieces of content 12px apart. The header's 44px row leaves 8px under
 * the title, so 16px show below it, half of what shows above it once the page
 * puts 24px between sections.
 */
export function Section({
  className,
  children,
  ...header
}: SectionHeaderProps & { className?: string; children: React.ReactNode }) {
  const id = React.useId()

  return (
    <section aria-labelledby={id} className={cn("min-w-0", className)}>
      <SectionHeader id={id} {...header} />
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  )
}
