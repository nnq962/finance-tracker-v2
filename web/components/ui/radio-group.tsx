"use client"

import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

/** A 24px circle; the chosen one fills dark with a light dot that springs in. */
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group/radio relative grid size-6 shrink-0 place-items-center rounded-full ring-[1.5px] ring-input transition-[background-color,box-shadow] duration-150 ring-inset outline-none after:absolute after:-inset-2.5 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive data-checked:bg-primary data-checked:ring-0",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-2 scale-0 rounded-full bg-primary-foreground transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] group-data-checked/radio:scale-100 motion-reduce:duration-150 motion-reduce:ease-out"
      />
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
