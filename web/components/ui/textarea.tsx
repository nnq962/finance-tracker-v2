import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full min-w-0 rounded-xl border border-transparent bg-surface-2 px-3.5 py-3 text-base text-foreground md:text-sm",
        "outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground/70",
        "enabled:not-focus:not-aria-invalid:hover:bg-secondary focus:border-foreground/15 focus:bg-card focus:ring-4 focus:ring-foreground/5",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-expense-soft aria-invalid:focus:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
