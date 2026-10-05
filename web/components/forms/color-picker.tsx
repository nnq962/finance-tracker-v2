"use client"

import { CheckIcon } from "lucide-react"

import {
  categoryColorOptions,
  type CategoryColorName,
} from "@/lib/categories/category-colors"

type ColorPickerProps = {
  onValueChange: (value: CategoryColorName) => void
  value: CategoryColorName
}

/** Picks one of the category colours; same radio pattern as IconPicker. */
export function ColorPicker({ onValueChange, value }: ColorPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Màu"
      className="grid grid-cols-5 gap-3 rounded-lg border p-3"
    >
      {categoryColorOptions.map((option) => {
        const isSelected = option.name === value

        return (
          <button
            key={option.name}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            onClick={() => onValueChange(option.name)}
            className={`flex size-9 items-center justify-center justify-self-center rounded-full text-white outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 ${option.dotClassName} ${
              isSelected ? "ring-3 ring-offset-2 ring-offset-background ring-primary" : "hover:scale-110"
            }`}
          >
            {isSelected ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
          </button>
        )
      })}
    </div>
  )
}
