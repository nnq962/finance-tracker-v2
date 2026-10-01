"use client"

import * as React from "react"
import { cn } from "cn"
import { Separator as SeparatorPrimitive } from "radix-ui"

const separatorVariants = {
  default: "",
  // 2px rounded rule in the card border color, matching chunky outlines.
  chunky:
    "rounded-full bg-[#e7e4dd] data-horizontal:h-0.5 data-vertical:w-0.5 dark:bg-[#35323e]",
} as const

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant = "default",
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  variant?: keyof typeof separatorVariants
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      data-variant={variant}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        separatorVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Separator }
