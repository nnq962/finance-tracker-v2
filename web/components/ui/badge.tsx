import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 py-1 font-sans text-xs leading-none font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:ring-2 aria-invalid:ring-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Soft tints by meaning; colour stays small, as in the minimal design.
        default: "bg-income-soft text-income",
        secondary: "bg-transfer-soft text-transfer",
        destructive: "bg-expense-soft text-expense",
        outline: "bg-secondary text-muted-foreground",
        ghost: "text-foreground hover:bg-secondary",
        link: "text-foreground underline-offset-4 hover:underline",
        sun: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
        grape: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
        solid: "bg-expense text-white",
        // On a filled button: a lighter pill in the button's own text colour.
        onFill: "bg-white/22 text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
