"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Toggle as TogglePrimitive } from "radix-ui"

// Colours change at once, as native chips do: a fade from white to black
// passes through grey, and stalls there when the page is busy (the list
// behind a filter chip re-rendering), which reads as a flicker.
const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1.5 rounded-full text-sm whitespace-nowrap transition-[scale] duration-150 ease-out outline-none motion-safe:will-change-transform motion-safe:active:scale-[0.96] hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 aria-pressed:hover:text-primary-foreground dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // A filled grey chip; the chosen one turns dark.
        default: "bg-field text-foreground",
        // On a grey panel (the assistant's drafts): white, lifted as the
        // elevated button (2026-10-21; was white with a border).
        elevated: "bg-control shadow-control hover:bg-[color-mix(in_oklab,var(--control),var(--foreground)_4%)]",
        // Inside a ToggleGroup of the same variant: the chosen option white on
        // the grey rail, as Tabs variant="segmented" (pill, 44 tall, the same
        // thumb shadow; 2026-10-21).
        segmented:
          "h-9! flex-1 rounded-full bg-transparent text-muted-foreground hover:bg-transparent data-[state=on]:bg-control data-[state=on]:text-foreground data-[state=on]:shadow-control data-[state=on]:hover:bg-control data-[state=on]:hover:text-foreground",
      },
      size: {
        // 40 and 36 tall, their touch area stretched to 44 with an invisible margin (2026-10-21).
        default:
          "relative h-10 min-w-10 px-4 after:absolute after:inset-x-0 after:-inset-y-0.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "relative h-9 min-w-9 px-3.5 after:absolute after:inset-x-0 after:-inset-y-1 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-11 min-w-11 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
