import type { LucideIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { Card } from "@/components/ui/card"
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
 * Two figures side by side, money one way and the other, as tiles that also
 * switch the list below, as in banking apps: a tap shows only that side, the
 * chosen tile turning dark; a second tap shows all again (`null`).
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
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {tiles.map((tile) => {
        const selected = value === tile.value
        return (
          <Card key={tile.value} asChild size="sm" variant={selected ? "inverse" : "default"}>
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onValueChange(selected ? null : tile.value)}
              className="pressable px-(--card-spacing) text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span className="flex items-center gap-2">
                <IconTile icon={tile.icon} tone={tile.tone} size="sm" />
                <CardLabel as="span">{tile.label}</CardLabel>
              </span>
              <span className="flex flex-col gap-0.5">
                <Money amount={tile.amount} size="lg" />
                <CardLabel as="span" className="text-xs">
                  {tile.caption}
                </CardLabel>
              </span>
            </button>
          </Card>
        )
      })}
    </div>
  )
}
