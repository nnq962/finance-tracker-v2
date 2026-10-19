import * as React from "react"
import { cn } from "cn"
import { Slot } from "radix-ui"

function Card({
  className,
  size = "default",
  variant = "default",
  blend = "profile",
  discs = false,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "sm" | "lg"
  /**
   * default: the plain card, white (grey in the dark theme); since 2026-10-19
   * evening also every page's lead card, which leads by its figure's size.
   * inverse: black (white in the dark theme), the landing, login and welcome
   * cards; two soft discs off its top right corner give it depth.
   * pastel: lime, mint and sky blending on white (deep on the card grey in the
   * dark), dark text: the lead cards for a day on 2026-10-19, now the catalog only.
   */
  variant?: "default" | "inverse" | "pastel"
  /**
   * Which way a pastel card's hues lie (2026-10-19): the same three on every
   * page, each lead card lit from its own corner. net: Tài sản ròng; balance:
   * Tổng số dư; flow: Giao dịch; debts: Vay nợ; profile: the person (default).
   */
  blend?: "net" | "balance" | "flow" | "debts" | "profile"
  /** Two soft discs off an inverse or pastel card's top right corner; off by default since 2026-10-19 (every lead card is flat); the landing and login still turn them on. */
  discs?: boolean
  /** The card is its child, e.g. a button for a card that is tapped as a whole. */
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-blend={variant === "pastel" ? blend : undefined}
      data-discs={(variant === "inverse" || variant === "pastel") && discs}
      className={cn(
        "group/card surface-plain flex flex-col shadow-card data-[variant=inverse]:shadow-none gap-(--card-spacing) overflow-hidden rounded-[20px] bg-card py-(--card-spacing) text-sm text-card-foreground [--card-spacing:--spacing(5)] has-[>img:first-child]:pt-0 data-[size=sm]:rounded-[16px] data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=lg]:rounded-[24px] data-[size=lg]:[--card-spacing:--spacing(6)] *:[img:first-child]:rounded-t-[20px] *:[img:last-child]:rounded-b-[20px] data-[variant=inverse]:bg-inverse data-[variant=inverse]:text-inverse-foreground data-[variant=pastel]:relative data-[variant=pastel]:isolate data-[variant=pastel]:bg-pastel data-[blend=net]:bg-pastel-net data-[blend=balance]:bg-pastel-balance data-[blend=flow]:bg-pastel-flow data-[blend=debts]:bg-pastel-debts data-[variant=pastel]:shadow-pastel",
        "data-[variant=inverse]:relative data-[variant=inverse]:isolate data-[discs=true]:before:pointer-events-none data-[discs=true]:before:absolute data-[discs=true]:before:-top-16 data-[discs=true]:before:-right-14 data-[discs=true]:before:-z-10 data-[discs=true]:before:size-48 data-[discs=true]:before:rounded-full data-[discs=true]:before:bg-inverse-foreground/10 data-[discs=true]:after:pointer-events-none data-[discs=true]:after:absolute data-[discs=true]:after:-right-4 data-[discs=true]:after:-bottom-20 data-[discs=true]:after:-z-10 data-[discs=true]:after:size-40 data-[discs=true]:after:rounded-full data-[discs=true]:after:bg-inverse-foreground/5 data-[discs=true]:data-[variant=pastel]:before:bg-pastel-tile data-[discs=true]:data-[variant=pastel]:after:bg-pastel-tile/60",
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
