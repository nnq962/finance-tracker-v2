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
 * The lead variant's two tiles: money in on the accent lime, money out on the
 * black, each with its arrow in a disc at the top right.
 */
const leadTileClassName = {
  income: { tile: "bg-ai text-ai-foreground", sub: "text-ai-foreground/60", disc: "bg-ai-foreground text-ai" },
  expense: { tile: "bg-inverse text-inverse-foreground", sub: "text-inverse-foreground/60", disc: "bg-inverse-foreground/15" },
} as const

const leadGridClassName = "grid grid-cols-2 gap-2"

/**
 * A page's lead figures (Giao dịch): the two sides as two tiles, money in on
 * the lime and money out on the black, figures only.
 */
function LeadFlowTiles<T extends string>({ tiles, className }: { tiles: FlowTile<T>[]; className?: string }) {
  return (
    <div className={cn(leadGridClassName, className)}>
      {tiles.map((tile) => {
        const look = leadTileClassName[tile.tone]
        return (
          <div key={tile.value} className={cn("@container flex min-w-0 flex-col gap-4 rounded-[24px] p-4", look.tile)}>
            <span className="flex min-w-0 items-center justify-between gap-2">
              <span className={cn("truncate text-sm", look.sub)}>{tile.label}</span>
              <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4", look.disc)}>
                <tile.icon />
              </span>
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <Money
                amount={tile.tone === "expense" ? -Math.abs(tile.amount) : tile.amount}
                sign={tile.amount === 0 ? "never" : "always"}
                size="lg"
                fit
              />
              <span className={cn("text-xs", look.sub)}>{tile.caption}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Money one way and the other, as the two halves of one card split by a thin
 * line, as in banking apps. Only money coming in is coloured. Each half is a
 * container its amount fits to, so a long one never breaks across lines.
 * Without `onValueChange` the card only shows the figures (the transactions
 * page filters with a chip row instead). With it, each half also switches the
 * list below: a tap shows only that side, its half shaded and the other
 * dimmed; a second tap shows all again (`null`).
 *
 * `variant="lead"`: the page's lead figures, as two tiles (lime in, black
 * out) rather than one white card; figures only, no `onValueChange`.
 */
export function FlowTiles<T extends string>({
  tiles,
  value,
  onValueChange,
  variant = "default",
  className,
}: {
  tiles: FlowTile<T>[]
  value?: T | null
  onValueChange?: (value: T | null) => void
  variant?: "default" | "lead"
  className?: string
}) {
  if (variant === "lead") return <LeadFlowTiles tiles={tiles} className={className} />

  return (
    <Card className={cn(splitCardClassName, className)}>
      {tiles.map((tile) => {
        const selected = value === tile.value
        const Half = onValueChange ? "button" : "div"
        return (
          <Half
            key={tile.value}
            {...(onValueChange
              ? {
                  type: "button" as const,
                  "aria-pressed": selected,
                  onClick: () => onValueChange(selected ? null : tile.value),
                }
              : {})}
            className={cn(
              "@container flex min-w-0 flex-col gap-3 p-4 text-left",
              onValueChange &&
                "transition-[background-color,opacity] duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset active:bg-muted motion-reduce:transition-none",
              selected && "bg-muted",
              value != null && !selected && "opacity-45",
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
          </Half>
        )
      })}
    </Card>
  )
}

/** Same footprint as FlowTiles, for loading states. */
export function FlowTilesSkeleton({ variant = "default" }: { variant?: "default" | "lead" }) {
  if (variant === "lead") {
    // The label beside the 32 disc, 16 apart from the amount's 28px line and the caption's 16px one.
    return (
      <div aria-hidden="true" className={leadGridClassName}>
        {[0, 1].map((index) => (
          <Card key={index} className="gap-4 rounded-[24px] p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="size-8 rounded-full" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex h-7 items-center">
                <Skeleton className="h-6 w-28 max-w-full" />
              </div>
              <div className="flex h-4 items-center">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

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
