"use client"

import { CheckIcon } from "lucide-react"

import {
  categoryColorOptions,
  type CategoryColorName,
} from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

type ColorPickerProps = {
  onValueChange: (value: CategoryColorName) => void
  value: CategoryColorName
}

/**
 * One of the category colours, as round swatches on a white card, five to a
 * row; the chosen one ringed, with a tick. Each swatch is the colour itself,
 * which the user is choosing.
 */
export function ColorPicker({ onValueChange, value }: ColorPickerProps) {
  return (
    <div role="group" aria-label="Màu" className="grid grid-cols-5 gap-1 rounded-[20px] bg-card p-2">
      {categoryColorOptions.map((option) => {
        const chosen = option.name === value

        return (
          <button
            key={option.name}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={chosen}
            onClick={() => onValueChange(option.name)}
            className="pressable grid h-12 place-items-center rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-white",
                option.dotClassName,
                chosen && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
              )}
            >
              {chosen ? <CheckIcon className="size-4" strokeWidth={3} aria-hidden="true" /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
