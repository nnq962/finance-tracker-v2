"use client"

import { CheckIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  categoryColorOptions,
  type CategoryColorName,
} from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

type ColorPickerProps = {
  onValueChange: (value: CategoryColorName) => void
  value: CategoryColorName
}

/** Picks one of the category colours; same single-choice pattern as IconPicker. */
export function ColorPicker({ onValueChange, value }: ColorPickerProps) {
  return (
    <ToggleGroup
      type="single"
      size="lg"
      value={value}
      onValueChange={(next) => {
        // A second tap on the chosen colour keeps it chosen.
        if (next) onValueChange(next as CategoryColorName)
      }}
      aria-label="Màu"
      className="grid w-full grid-cols-5"
    >
      {categoryColorOptions.map((option) => (
        <ToggleGroupItem
          key={option.name}
          value={option.name}
          aria-label={option.label}
          title={option.label}
          className="justify-self-center"
        >
          {/* The swatch is the colour itself, which the user is choosing. */}
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-white",
              option.dotClassName,
            )}
          >
            {option.name === value ? <CheckIcon className="size-3" aria-hidden="true" /> : null}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
