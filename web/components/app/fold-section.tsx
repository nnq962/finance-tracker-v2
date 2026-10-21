"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Collapse } from "@/components/app/collapse"

/**
 * A grouped list folded under its caption (SettingsGroup `collapsible`): the
 * caption's "Hiện … ⌄" opens it, "Thu gọn ⌃" folds it, the rows sliding with
 * Collapse (2026-10-21; Radix's height keyframes before, which could not turn
 * back mid-way and cut the cards' shadows while they slid).
 */
export function FoldSection({
  title,
  titleClassName,
  captionClassName,
  showLabel,
  defaultOpen = false,
  children,
}: {
  title?: React.ReactNode
  titleClassName?: string
  captionClassName?: string
  /** What opening it shows, e.g. "Hiện 2 khoản". */
  showLabel: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const id = React.useId()

  return (
    <section className="flex flex-col">
      <div className={captionClassName}>
        {title ? <h2 className={titleClassName}>{title}</h2> : null}
        {/* As the "Xem tất cả ›" of a section's title (SectionHeader), the chevron turning to say it folds. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((current) => !current)}
          className="relative flex shrink-0 items-center gap-0.5 text-sm font-medium text-foreground/70 transition-[color,opacity] duration-150 ease-out outline-none after:absolute after:-inset-x-2 after:-inset-y-3 hover:text-foreground focus-visible:underline active:opacity-60"
        >
          {open ? "Thu gọn" : showLabel}
          <ChevronDownIcon
            aria-hidden="true"
            className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {/* The space under the caption slides with the rows, inside the fold: closed, it leaves no margin. */}
      <Collapse open={open}>
        <div id={id} className="flex flex-col gap-2 pt-2">
          {children}
        </div>
      </Collapse>
    </section>
  )
}
