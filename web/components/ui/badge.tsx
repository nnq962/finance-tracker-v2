import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-[11px] pt-[5px] pb-1 font-heading text-xs leading-[1.2] font-extrabold tracking-[0.06em] uppercase whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38b8f6] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:ring-2 aria-invalid:ring-[#ff645f] [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-[oklch(0.95_0.06_138)] text-[oklch(0.60_0.17_140)] dark:bg-[oklch(0.30_0.07_138)] dark:text-[oklch(0.82_0.15_138)]",
        secondary:
          "bg-[oklch(0.95_0.04_235)] text-[oklch(0.58_0.14_240)] dark:bg-[oklch(0.30_0.06_235)] dark:text-[oklch(0.82_0.10_235)]",
        destructive:
          "bg-[oklch(0.95_0.04_25)] text-[oklch(0.56_0.18_25)] dark:bg-[oklch(0.30_0.07_25)] dark:text-[oklch(0.82_0.13_25)]",
        outline:
          "bg-[#f3f1ec] text-[#686470] dark:bg-[#34323a] dark:text-[#d4d0d9]",
        ghost:
          "text-[oklch(0.58_0.14_240)] hover:bg-[oklch(0.95_0.04_235)] dark:text-[oklch(0.82_0.10_235)] dark:hover:bg-[oklch(0.30_0.06_235)]",
        link:
          "text-[oklch(0.58_0.14_240)] underline-offset-4 hover:underline dark:text-[oklch(0.82_0.10_235)]",
        sun:
          "bg-[oklch(0.96_0.06_85)] text-[oklch(0.70_0.15_70)] dark:bg-[oklch(0.32_0.07_85)] dark:text-[oklch(0.88_0.13_85)]",
        grape:
          "bg-[oklch(0.95_0.04_300)] text-[oklch(0.52_0.17_300)] dark:bg-[oklch(0.30_0.07_300)] dark:text-[oklch(0.80_0.13_300)]",
        solid:
          "bg-[oklch(0.70_0.19_25)] text-white dark:bg-[oklch(0.70_0.19_25)]",
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
