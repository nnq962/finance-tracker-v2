import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// On touch screens an invisible ::after grows every size to a 44px tap
// target (Apple's minimum) without changing how the button looks.
const touchTarget =
  "relative pointer-coarse:after:absolute pointer-coarse:after:content-['']"

// Flat pills, as in iOS apps: pressing shrinks the button a little.
const buttonVariants = cva(
  `${touchTarget} group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-sans text-sm leading-none font-semibold whitespace-nowrap transition-[background-color,border-color,color,opacity,scale] duration-150 ease-out outline-none select-none active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/88",
        outline:
          "border-border bg-card text-foreground hover:bg-secondary aria-expanded:bg-secondary aria-pressed:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70 aria-expanded:bg-secondary/70",
        // Premium (upgrading to Pro) and the AI assistant: the one accent.
        grape: "bg-[#7c5cff] text-white hover:bg-[#7c5cff]/90",
        ghost:
          "text-foreground hover:bg-secondary aria-expanded:bg-secondary",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "rounded-md text-foreground underline underline-offset-4 decoration-foreground/30 hover:decoration-foreground active:scale-100",
      },
      size: {
        default:
          "pointer-coarse:after:-inset-y-0.5 pointer-coarse:after:inset-x-0 h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "pointer-coarse:after:-inset-y-2 pointer-coarse:after:-inset-x-1 h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "pointer-coarse:after:-inset-y-1.5 pointer-coarse:after:inset-x-0 h-8 gap-1.5 px-3 text-[0.8125rem] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-[0.9375rem] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-5",
        icon: "pointer-coarse:after:-inset-0.5 size-10",
        "icon-xs":
          "pointer-coarse:after:-inset-2 size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "pointer-coarse:after:-inset-1.5 size-8",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
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
