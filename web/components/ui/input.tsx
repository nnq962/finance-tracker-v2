import * as React from "react"
import { cn } from "cn"

// Safari gives date and time fields a width of their own that a grid or
// flex cell cannot shrink, so two side by side ran past the card; without
// its native look the field takes its cell's width, its value on the left.
const dateLike = new Set(["date", "time", "datetime-local", "month", "week"])

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[var(--control-h,2.75rem)] w-full min-w-0 rounded-[var(--control-radius,0.75rem)] border border-transparent bg-field px-[var(--control-px,1rem)] py-2 text-base transition-[color,background-color,box-shadow] duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive md:text-sm",
        type && dateLike.has(type) && "block appearance-none text-left [&::-webkit-date-and-time-value]:text-left",
        className
      )}
      {...props}
    />
  )
}

export { Input }
