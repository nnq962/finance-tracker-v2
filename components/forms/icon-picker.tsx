"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
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
    <div className="rounded-lg border">
      <ScrollArea className="h-48">
        <div
          role="radiogroup"
          aria-label="Biểu tượng"
          className="grid w-full grid-cols-6 p-2 sm:grid-cols-8"
        >
          {categoryIconOptions.map((option) => {
            const Icon = categoryIconRegistry[option.name]
            const isSelected = option.name === value

            return (
              <button
                key={option.name}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={option.label}
                onClick={() => onValueChange(option.name)}
                className={`flex size-8 items-center justify-center justify-self-center rounded-md transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  isSelected
                    ? selectedColor.selectedClassName
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
