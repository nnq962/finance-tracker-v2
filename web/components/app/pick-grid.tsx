"use client"

import type * as React from "react"
import { LayoutGridIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { groupCaptionClassName } from "@/components/settings-list"
import { FieldError } from "@/components/ui/field"
import { cn } from "@/lib/utils"

export type PickGridItem = {
  id: string
  label: string
  /** The cell's 36 tile: an IconTile, an AccountLogo. */
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
  error,
}: {
  /** The first cell's id, for focusing the grid when nothing is chosen. */
  id: string
  caption: string
  items: PickGridItem[]
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
            {/* A name of one long word (Techcombank) a size down on phones, as it cannot wrap. */}
            <span
              className={cn(
                "line-clamp-2 w-full px-0.5 text-xs leading-tight",
                item.label.split(" ").some((word) => word.length > 9) && "max-sm:text-[11px] max-sm:tracking-tight",
              )}
            >
              {item.label}
            </span>
          </button>
        ))}
        <button type="button" id={items.length === 0 ? id : undefined} onClick={onShowAll} className={cellClassName}>
          <IconTile icon={LayoutGridIcon} />
          <span className="text-xs leading-tight">Tất cả</span>
        </button>
      </div>
      {error ? <FieldError className="px-4">{error}</FieldError> : null}
    </section>
  )
}

/** How many choices the grid shows before "Tất cả": two rows of four, the last cell being it. */
export const PICK_GRID_COUNT = 7

/** The first of `ordered` to fill the grid, `taken` cells fewer; the chosen one always among them, so it shows as chosen. */
export function gridChoices<T extends { id: string }>(ordered: readonly T[], chosenId: string, taken = 0) {
  const shown = ordered.slice(0, PICK_GRID_COUNT - taken)
  const chosen = ordered.find((item) => item.id === chosenId)
  if (chosen && !shown.includes(chosen)) shown[shown.length - 1] = chosen
  return shown
}
