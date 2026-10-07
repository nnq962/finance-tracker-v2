"use client"

import type * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type ChoiceTile<T extends string> = {
  value: T
  /** The figure the choice is about, e.g. a price. */
  title: React.ReactNode
  /** Under the title, e.g. how it is billed. */
  description?: React.ReactNode
  /** Across from the radio, e.g. what the option saves; short, as two tiles leave it ~80px. */
  badge?: React.ReactNode
}

const tones = {
  default: {
    tile: "aria-checked:border-foreground",
    radio: "group-aria-checked/choice:bg-primary",
    badge: "secondary",
  },
  // Pro and AI: the chosen tile tinted in the AI colour, as on pricing screens.
  ai: {
    tile: "aria-checked:border-ai aria-checked:bg-ai/10 dark:aria-checked:bg-ai/15",
    radio: "group-aria-checked/choice:bg-ai",
    badge: "ai",
  },
} as const

/**
 * A few options as tiles side by side, one of them chosen, as on pricing
 * screens: a radio at the top with a badge across from it, then the figure
 * and a line under it. A radio group underneath, so arrow keys move the
 * choice and screen readers hear a choice.
 */
export function ChoiceTiles<T extends string>({
  options,
  value,
  onValueChange,
  tone = "default",
  className,
  "aria-label": ariaLabel,
}: {
  options: ChoiceTile<T>[]
  value: T
  onValueChange: (value: T) => void
  tone?: keyof typeof tones
  className?: string
  "aria-label": string
}) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="choice-tiles"
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      aria-label={ariaLabel}
      className={cn("grid auto-cols-fr grid-flow-col gap-3", className)}
    >
      {options.map((option) => (
        <RadioGroupPrimitive.Item
          key={option.value}
          value={option.value}
          className={cn(
            "group/choice pressable flex min-h-30 min-w-0 flex-col rounded-2xl border-[1.5px] border-foreground/10 p-3.5 pb-4 text-left outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/30",
            tones[tone].tile,
          )}
        >
          <span className="flex min-h-6 items-center justify-between gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full ring-[1.5px] ring-foreground/20 ring-inset transition-[background-color,box-shadow] duration-150 group-aria-checked/choice:ring-0",
                tones[tone].radio,
              )}
            >
              <span className="size-2 scale-0 rounded-full bg-primary-foreground transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] group-aria-checked/choice:scale-100 motion-reduce:duration-150 motion-reduce:ease-out" />
            </span>
            {option.badge ? <Badge variant={tones[tone].badge}>{option.badge}</Badge> : null}
          </span>
          <span className="mt-auto pt-4 text-xl font-semibold tabular-nums">{option.title}</span>
          {option.description ? <span className="text-sm text-muted-foreground">{option.description}</span> : null}
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
