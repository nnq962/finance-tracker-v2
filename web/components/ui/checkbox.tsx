"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

/**
 * A 24px box, filled dark with a tick when checked. `shape="circle"` is the
 * round check of iOS lists (choosing several rows); square suits forms.
 */
function Checkbox({
  className,
  shape = "square",
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  shape?: "square" | "circle"
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-shape={shape}
      className={cn(
        "peer relative grid size-6 shrink-0 place-items-center rounded-lg ring-[1.5px] ring-input transition-[background-color,box-shadow] duration-150 ring-inset outline-none after:absolute after:-inset-2.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive data-[shape=circle]:rounded-full data-checked:bg-primary data-checked:text-primary-foreground data-checked:ring-0",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-items-center data-checked:animate-in data-checked:zoom-in-50 data-checked:duration-200"
      >
        <CheckIcon strokeWidth={3} className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
