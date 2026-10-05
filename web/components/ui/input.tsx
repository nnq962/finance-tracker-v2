import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Filled, borderless field: grey on white cards, white once focused.
        "h-11 w-full min-w-0 rounded-xl border border-transparent bg-surface-2 px-3.5 py-1 text-base text-foreground md:text-sm",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground/70",
        "enabled:not-focus:not-aria-invalid:hover:bg-secondary focus:border-foreground/15 focus:bg-card focus:ring-4 focus:ring-foreground/5",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-expense-soft aria-invalid:focus:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
