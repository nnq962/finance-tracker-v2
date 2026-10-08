import type { LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type FlowTile<T extends string> = {
  value: T
  label: string
  amount: number
  /** Under the amount, e.g. how many transactions or loans it adds up. */
  caption: string
  icon: LucideIcon
  /** income: money coming in; expense: money going out. */
  tone: "income" | "expense"
}

/**
 * The card both halves sit in, split by a hairline inset from the top and
 * bottom as in the Figma summary card, so the halves read as one card rather
 * than two cells of a table. The line belongs to the card, so a shaded or
 * dimmed half leaves it alone.
 */
const splitCardClassName =
  "relative grid grid-cols-2 gap-0 p-0 before:pointer-events-none before:absolute before:inset-y-4 before:left-1/2 before:w-px before:bg-border"

/**
 * Money one way and the other, as the two halves of one card split by a thin
 * line, as in banking apps. Each half also switches the list below: a tap
 * shows only that side, its half shaded and the other dimmed; a second tap
 * shows all again (`null`). Only money coming in is coloured. Each half is a
 * container its amount fits to, so a long one never breaks across lines.
 */
export function FlowTiles<T extends string>({
  tiles,
  value,
  onValueChange,
  className,
}: {
  tiles: FlowTile<T>[]
  value: T | null
  onValueChange: (value: T | null) => void
  className?: string
}) {
  return (
    <Card className={cn(splitCardClassName, className)}>
      {tiles.map((tile) => {
        const selected = value === tile.value
        return (
          <button
            key={tile.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onValueChange(selected ? null : tile.value)}
            className={cn(
              "@container flex min-w-0 flex-col gap-3 p-4 text-left transition-[background-color,opacity] duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset active:bg-muted motion-reduce:transition-none",
              selected && "bg-muted",
              value !== null && !selected && "opacity-45",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <IconTile icon={tile.icon} tone={tile.tone} size="sm" />
              <CardLabel as="span" className="truncate">
                {tile.label}
              </CardLabel>
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <Money
                amount={tile.tone === "expense" ? -Math.abs(tile.amount) : tile.amount}
                sign={tile.amount === 0 ? "never" : "always"}
                size="lg"
                fit
                tone={tile.tone === "income" && tile.amount !== 0 ? "income" : "default"}
              />
              <CardLabel as="span" className="text-xs">
                {tile.caption}
              </CardLabel>
            </span>
          </button>
        )
      })}
    </Card>
  )
}

/** Same footprint as FlowTiles, for loading states. */
export function FlowTilesSkeleton() {
  return (
    <Card aria-hidden="true" className={splitCardClassName}>
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-[10px]" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* On the amount's 28px line and the caption's 16px one, 2px apart, as in FlowTiles. */}
          <div className="flex flex-col gap-0.5">
            <div className="flex h-7 items-center">
              <Skeleton className="h-6 w-28 max-w-full" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </Card>
  )
}
