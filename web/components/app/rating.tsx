"use client"

import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Stars from 1 to max; a tap sets the rating. */
export function Rating({
  value,
  onValueChange,
  max = 5,
  label = "Đánh giá",
  className,
}: {
  value: number
  onValueChange: (value: number) => void
  max?: number
  label?: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex", className)}>
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} sao`}
            onClick={() => onValueChange(star)}
            className="grid size-9 place-items-center transition-[scale] duration-150 active:scale-75"
          >
            <StarIcon
              strokeWidth={1.5}
              className={cn("size-7", star <= value ? "fill-warning text-warning" : "text-input")}
            />
          </button>
        )
      })}
    </div>
  )
}
