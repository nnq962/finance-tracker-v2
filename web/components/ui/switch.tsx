"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // The mockup's switch: a 52×32 track, a 24px thumb 4px in from its edges.
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full p-1 transition-[background-color] duration-200 outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-8 data-[size=default]:w-[52px] data-[size=sm]:h-6 data-[size=sm]:w-10 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none grid place-items-center rounded-full bg-card text-primary shadow-sm dark:data-unchecked:bg-foreground ring-0 transition-transform duration-[400ms] ease-[cubic-bezier(.3,1.25,.6,1)] motion-reduce:transition-none group-data-[size=default]/switch:size-6 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-5 group-data-[size=sm]/switch:data-checked:translate-x-4 data-unchecked:translate-x-0"
      >
        {/* Off in dark, the thumb is light as iOS's (2026-10-21: the card's dark grey
            all but vanished on the grey track); on, it stays dark on the light track.
            A tick in the thumb says "on" without relying on colour alone; kept
            on its own layer, as iOS Safari otherwise re-snaps it half a pixel
            as the thumb starts moving. */}
        <CheckIcon
          aria-hidden="true"
          strokeWidth={3}
          className="size-3 opacity-0 transition-opacity duration-200 group-data-[size=sm]/switch:size-2.5 group-data-checked/switch:opacity-100"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
