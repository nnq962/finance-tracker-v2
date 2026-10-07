import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The small caption that names what a card shows ("TÀI SẢN RÒNG", "ĐÃ CHI"):
 * 12px capitals, semibold and lightly spaced, in the muted colour, as in the
 * mockup; on an inverse card, the card's light text at 60%. A heading by default (`as="h2"`), so the card is reachable by it.
 */
export function CardLabel({
  as: Component = "h2",
  className,
  ...props
}: React.ComponentProps<"h2"> & { as?: "h2" | "h3" | "p" }) {
  return (
    <Component
      data-slot="card-label"
      className={cn("text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase group-data-[variant=inverse]/card:text-primary-foreground/60", className)}
      {...props}
    />
  )
}
