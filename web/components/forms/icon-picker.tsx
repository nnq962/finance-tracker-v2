"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getCategoryColor } from "@/lib/categories/category-colors"
import {
  categoryIconOptions,
  categoryIconRegistry,
  type CategoryIconName,
} from "@/lib/icons/category-icon-registry"

import type { CategoryColorName } from "@/lib/categories/category-colors"

type IconPickerProps = {
  color: CategoryColorName
  onValueChange: (value: CategoryIconName) => void
  value: CategoryIconName
}

export function IconPicker({
  color,
  onValueChange,
  value,
}: IconPickerProps) {
  const selectedColor = getCategoryColor(color)

  return (
    <ScrollArea className="h-52">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => {
          // A second tap on the chosen icon keeps it chosen.
          if (next) onValueChange(next as CategoryIconName)
        }}
        aria-label="Biểu tượng"
        className="grid w-full grid-cols-6 sm:grid-cols-8"
      >
        {categoryIconOptions.map((option) => {
          const Icon = categoryIconRegistry[option.name]

          return (
            <ToggleGroupItem
              key={option.name}
              value={option.name}
              aria-label={option.label}
              className="justify-self-center"
            >
              {/* The chosen icon shows in the category's colour, as it will appear. */}
              <Icon className={option.name === value ? selectedColor.iconClassName : undefined} />
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
    </ScrollArea>
  )
}
