"use client"

import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

/**
 * A thick track with white thumbs. One value is a slider; two make a range.
 * With `formatValue`, a dark bubble shows the value above the thumb while it
 * is dragged.
 */
function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  formatValue,
  onPointerDown,
  onPointerUp,
  onLostPointerCapture,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  formatValue?: (value: number) => string
}) {
  const [dragging, setDragging] = React.useState(false)
  const values = value ?? defaultValue ?? [min]

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      onPointerDown={(event) => {
        setDragging(true)
        onPointerDown?.(event)
      }}
      onPointerUp={(event) => {
        setDragging(false)
        onPointerUp?.(event)
      }}
      onLostPointerCapture={(event) => {
        setDragging(false)
        onLostPointerCapture?.(event)
      }}
      className={cn(
        "relative flex h-11 w-full touch-none items-center select-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-2 grow overflow-hidden rounded-full bg-track"
      >
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((thumbValue, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          className="group/thumb relative grid size-7 place-items-center rounded-full bg-card shadow-[0_2px_8px_rgb(0_0_0/0.16),0_0_0_0.5px_rgb(0_0_0/0.06)] transition-transform duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-110 motion-reduce:duration-150 motion-reduce:ease-out dark:bg-foreground"
        >
          <span aria-hidden="true" className="size-2 rounded-full bg-foreground dark:bg-card" />
          {formatValue ? (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-full mb-2 rounded-full bg-primary px-2.5 py-1 text-xs font-medium whitespace-nowrap text-primary-foreground tabular-nums transition-[opacity,translate,scale] duration-200",
                dragging ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-75 opacity-0"
              )}
            >
              {formatValue(thumbValue)}
            </span>
          ) : null}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
