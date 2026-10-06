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
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-2 transition-colors duration-200 outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[31px] data-[size=default]:w-[51px] data-[size=sm]:h-6 data-[size=sm]:w-10 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary group-has-[:focus-visible]/field-label:data-checked:border-primary data-unchecked:border-transparent data-unchecked:bg-input/90 group-has-[:focus-visible]/field-label:data-unchecked:border-transparent data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none grid place-items-center rounded-full bg-card text-primary shadow-md ring-0 transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] will-change-transform not-dark:bg-clip-padding group-data-[size=default]/switch:size-[27px] group-data-[size=sm]/switch:size-5 group-data-[size=default]/switch:data-checked:translate-x-5 group-data-[size=sm]/switch:data-checked:translate-x-4 motion-reduce:duration-150 motion-reduce:ease-out dark:data-checked:bg-primary-foreground data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
      >
        {/* A tick in the thumb says "on" without relying on colour alone. Sized so it
            sits on whole pixels (27 − 13 = 14), and kept on its own layer: iOS
            Safari otherwise re-snaps it half a pixel down as the thumb starts moving. */}
        <CheckIcon
          aria-hidden="true"
          strokeWidth={3.5}
          className="size-[13px] opacity-0 transition-opacity duration-200 will-change-[opacity] group-data-[size=sm]/switch:size-2.5 group-data-checked/switch:opacity-100"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
