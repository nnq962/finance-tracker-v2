import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full resize-none rounded-[var(--control-radius,0.75rem)] border border-transparent bg-field px-[var(--control-px,1rem)] py-3 text-base transition-[color,background-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
