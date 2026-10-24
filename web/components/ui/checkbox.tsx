"use client"

import * as React from "react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

/**
 * A 24px box, filled dark with a tick when checked. `shape="circle"` is the
 * round check of iOS lists (choosing several rows); square suits forms.
 *
 * Ticking (2026-10-24, transitions.dev "checkbox check"): the box fills in
 * 150ms while the tick draws itself from its short arm, 300ms ease-out;
 * unticking rubs it out the same way back in 150ms, and a tap mid-way turns
 * it round. The tick keeps the fill's text colour throughout, so it never
 * shows dark on the emptying box. Reduced motion: the tick fades in 150ms,
 * no draw.
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
        "group/checkbox peer relative grid size-6 shrink-0 place-items-center rounded-lg text-primary-foreground ring-[1.5px] ring-foreground/35 dark:ring-foreground/30 transition-[background-color,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ring-inset outline-none after:absolute after:-inset-2.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive data-[shape=circle]:rounded-full data-checked:bg-primary data-checked:ring-0",
        className
      )}
      {...props}
    >
      {/* Always there, so the tick can be drawn in and rubbed out rather than shown and hidden. */}
      <CheckboxPrimitive.Indicator forceMount data-slot="checkbox-indicator" className="grid place-items-center">
        {/* Lucide's check, drawn the other way round: from the short arm, as a hand ticks. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-3.5 motion-reduce:opacity-0 motion-reduce:transition-opacity motion-reduce:duration-150 motion-reduce:ease-out motion-reduce:group-data-[state=checked]/checkbox:opacity-100"
        >
          <path
            d="M4 12l5 5L20 6"
            className="transition-[stroke-dashoffset] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] [stroke-dasharray:23] [stroke-dashoffset:23] group-data-[state=checked]/checkbox:duration-300 group-data-[state=checked]/checkbox:[stroke-dashoffset:0] motion-reduce:transition-none motion-reduce:[stroke-dashoffset:0]"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
