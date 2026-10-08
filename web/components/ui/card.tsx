import * as React from "react"
import { cn } from "cn"
import { Slot } from "radix-ui"

function Card({
  className,
  size = "default",
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg"
  /** inverse: black (a raised grey in the dark theme), for the one card a page leads with, like a balance. */
  variant?: "default" | "inverse"
  /** The card is its child, e.g. a button for a card that is tapped as a whole. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/card surface-plain flex flex-col gap-(--card-spacing) overflow-hidden rounded-[20px] bg-card py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:rounded-[16px] data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=lg]:rounded-[24px] data-[size=lg]:[--card-spacing:--spacing(6)] *:[img:first-child]:rounded-t-[20px] *:[img:last-child]:rounded-b-[20px] data-[variant=inverse]:bg-inverse data-[variant=inverse]:text-inverse-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-[20px] px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-heading text-base font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-[20px] px-(--card-spacing) [.border-t]:pt-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
