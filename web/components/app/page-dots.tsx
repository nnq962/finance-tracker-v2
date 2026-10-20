"use client"

import { cn } from "@/lib/utils"

/**
 * Which page of a carousel or onboarding is showing: the current dot
 * stretches into a bar. With onValueChange the dots are buttons.
 */
export function PageDots({
  count,
  value,
  onValueChange,
  className,
}: {
  count: number
  value: number
  onValueChange?: (index: number) => void
  className?: string
}) {
  const dot = (index: number) =>
    cn(
      "h-2 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:duration-150 motion-reduce:ease-out",
      index === value ? "w-6 bg-primary" : "w-2 bg-foreground/25",
    )

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Array.from({ length: count }, (_, index) =>
        onValueChange ? (
          <button
            key={index}
            type="button"
            aria-label={`Trang ${index + 1}`}
            aria-current={index === value || undefined}
            onClick={() => onValueChange(index)}
            className={cn(dot(index), "relative after:absolute after:-inset-x-1.5 after:-inset-y-4")}
          />
        ) : (
          <span key={index} aria-hidden="true" className={dot(index)} />
        ),
      )}
    </div>
  )
}
