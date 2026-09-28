import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const pressEffect =
  "button-raised bg-transparent text-[var(--button-text)] hover:brightness-105 disabled:[--button-face:#e8e6e1] disabled:[--button-text:#aaa6ae] disabled:[--button-shade:#d4d1ca] disabled:brightness-100"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-border font-heading text-sm leading-none font-extrabold tracking-[0.06em] uppercase whitespace-nowrap [--button-edge:3px] transition-[background-color,border-color,color,filter] duration-[80ms] outline-none select-none disabled:pointer-events-none aria-invalid:border-[#ff645f] aria-invalid:ring-3 aria-invalid:ring-[#ffe5e1] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: `[--button-face:#6ecc49] [--button-shade:#3e9727] [--button-text:#fff] ${pressEffect}`,
        outline:
          `[--button-face-border:2px] aria-expanded:[--button-face:#d6f4ff] aria-pressed:[--button-face:#d6f4ff] [--button-face:#fff] [--button-shade:#e7e4dd] [--button-text:#0083c4] ${pressEffect}`,
        secondary:
          `[--button-face:#38b8f6] [--button-shade:#0083c4] [--button-text:#fff] ${pressEffect}`,
        ghost:
          "text-[#0083c4] hover:bg-[#d6f4ff] aria-expanded:bg-[#d6f4ff] disabled:opacity-50 dark:text-[#38b8f6] dark:hover:bg-[#d6f4ff]/15 dark:aria-expanded:bg-[#d6f4ff]/15",
        destructive:
          `[--button-face:#ff645f] [--button-shade:#c8393a] [--button-text:#fff] ${pressEffect}`,
        link: "text-[#0083c4] underline-offset-4 hover:underline disabled:opacity-50 dark:text-[#38b8f6]",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3 [--button-edge:2px]",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5 [--button-edge:3px]",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [--button-edge:6px]",
        icon: "size-8 [--button-edge:3px]",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3 [--button-edge:2px]",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg [--button-edge:3px]",
        "icon-lg": "size-9 [--button-edge:6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
