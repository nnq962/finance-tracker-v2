import { ChevronRightIcon } from "lucide-react"

import { LimitBar, type LimitTone } from "@/components/app/limit-bar"
import { settingsSeparatorClassName } from "@/components/settings-list"
import { cn } from "@/lib/utils"

/**
 * A row of a list (`SettingsGroup`) for a limit and what is used of it
 * (2026-10-16, spending limits): the tile, the name and the figure (spent /
 * limit) on one line, the bar under them, and a caption under the bar (what
 * is left a day, or how far over: red with `tone="over"`). 76 high, taller
 * than a row's 64 for the bar. A tap opens it (chevron at the end).
 */
export function LimitRow({
  media,
  title,
  figure,
  value,
  max,
  tone = "ok",
  caption,
  onClick,
}: {
  media: React.ReactNode
  title: React.ReactNode
  /** At the end of the title's line, e.g. "3,42tr / 4tr". */
  figure: React.ReactNode
  value: number
  max: number
  tone?: LimitTone
  caption: React.ReactNode
  onClick: () => void
}) {
  return (
    <li className={settingsSeparatorClassName(true)}>
      <button
        type="button"
        onClick={onClick}
        className="relative flex min-h-19 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:z-1 hover:bg-muted active:z-1 active:bg-muted"
      >
        <span data-slot="item-media" className="shrink-0">
          {media}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">{title}</span>
            <span className="shrink-0 text-sm tabular-nums">{figure}</span>
          </span>
          <LimitBar value={value} max={max} tone={tone} />
          <span className={cn("truncate text-xs text-muted-foreground", tone === "over" && "text-expense")}>{caption}</span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  )
}
