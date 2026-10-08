"use client"

import type * as React from "react"
import { LayoutGridIcon, type LucideIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { groupCaptionClassName } from "@/components/settings-list"
import { FieldError } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export type PickGridItem = {
  id: string
  label: string
  /** The cell's tile: an IconTile (40), an AccountLogo (36; set `tileSize="sm"`). */
  media: React.ReactNode
}

/**
 * A choice as a grid of tiles, as money apps pick a category or a bank: four
 * to a row on a white card under a caption, the chosen one ringed, and
 * "Tất cả" last, for the whole list on a deeper screen. Give it the few most
 * likely (two rows of four, the last cell being "Tất cả"), the chosen one
 * among them.
 */
export function PickGrid({
  id,
  caption,
  items,
  value,
  onValueChange,
  onShowAll,
  labelLines = 2,
  tileSize = "md",
  tileShape = "rounded",
  allIcon = LayoutGridIcon,
  allLabel = "Tất cả",
  error,
}: {
  /** The first cell's id, for focusing the grid when nothing is chosen. */
  id: string
  caption: string
  items: PickGridItem[]
  /** 2: names wrap to a second line (categories); 1: one line, a long one cut with "…" (banks, wallets). */
  labelLines?: 1 | 2
  /** The size of the cells' tiles, for "Tất cả" to match them: md (IconTile's own) or sm (36, AccountLogo). */
  tileSize?: "sm" | "md"
  /** circle: the cells are people (ContactAvatar), so "Tất cả" is round too. */
  tileShape?: "rounded" | "circle"
  /** The last cell's icon and name, e.g. a person with a plus when there is no one to show yet. */
  allIcon?: LucideIcon
  allLabel?: string
  value: string
  onValueChange: (id: string) => void
  onShowAll: () => void
  error?: string
}) {
  const cellClassName =
    "pressable flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-2 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/30"

  return (
    <section aria-labelledby={`${id}-caption`} className="flex flex-col gap-2">
      <h3 id={`${id}-caption`} className={cn("px-4", groupCaptionClassName, error && "text-destructive")}>
        {caption}
      </h3>
      <div className={cn("grid grid-cols-4 gap-1 rounded-[20px] bg-card p-2", error && "ring-2 ring-destructive/60")}>
        {items.map((item, index) => (
          <button
            key={item.id}
            id={index === 0 ? id : undefined}
            type="button"
            aria-pressed={item.id === value}
            onClick={() => onValueChange(item.id)}
            className={cn(cellClassName, item.id === value && "bg-muted ring-2 ring-foreground ring-inset")}
          >
            {item.media}
            <span className={cn("w-full px-1 text-xs leading-tight", labelLines === 1 ? "truncate" : "line-clamp-2")}>
              {item.label}
            </span>
          </button>
        ))}
        <button type="button" id={items.length === 0 ? id : undefined} onClick={onShowAll} className={cellClassName}>
          <IconTile icon={allIcon} size={tileSize} shape={tileShape} />
          <span className="text-xs leading-tight">{allLabel}</span>
        </button>
      </div>
      {error ? <FieldError className="px-4">{error}</FieldError> : null}
    </section>
  )
}

/** How many choices the grid shows before "Tất cả": two rows of four, the last cell being it. */
export const PICK_GRID_COUNT = 7

/**
 * The first of `ordered` to fill the grid, `taken` cells fewer; the chosen one
 * always among them, so it shows as chosen. `count`: 3 for one row.
 */
export function gridChoices<T extends { id: string }>(ordered: readonly T[], chosenId: string, taken = 0, count = PICK_GRID_COUNT) {
  const shown = ordered.slice(0, count - taken)
  const chosen = ordered.find((item) => item.id === chosenId)
  if (chosen && !shown.includes(chosen)) shown[shown.length - 1] = chosen
  return shown
}
