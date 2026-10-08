import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The small caption that names what a card shows ("Tài sản ròng", "Đã chi"):
 * 14px grey text above the figure, as in the mockup; on an inverse card, the
 * card's light text at 60%. A heading by default (`as="h2"`), so the card is
 * reachable by it.
 */
export function CardLabel({
  as: Component = "h2",
  className,
  ...props
}: React.ComponentProps<"h2"> & { as?: "h2" | "h3" | "p" | "span" }) {
  return (
    <Component
      data-slot="card-label"
      className={cn("text-sm text-muted-foreground group-data-[variant=inverse]/card:text-inverse-foreground/60", className)}
      {...props}
    />
  )
}
