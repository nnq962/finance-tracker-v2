import type { LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      // sm: a list row's icon (36, as in the mockup's settings list); md: a
      // transaction or category row; lg: a card's or a sheet's lead.
      size: {
        sm: "size-9 [&_svg]:size-[18px]",
        md: "size-10 [&_svg]:size-5",
        lg: "size-12 [&_svg]:size-6",
      },
      // rounded: the mockup's tile, a soft square; circle is kept for faces and initials.
      shape: {
        rounded: "rounded-xl data-[size=lg]:rounded-2xl",
        circle: "rounded-full",
      },
    },
    defaultVariants: { size: "md", shape: "rounded" },
  },
)

// Meaning colours, for tiles that are not about a category.
const semanticTones = {
  neutral: "bg-muted text-foreground",
  income: "bg-income/10 text-income dark:bg-income/15",
  expense: "bg-expense/10 text-expense dark:bg-expense/15",
  transfer: "bg-transfer/10 text-transfer dark:bg-transfer/15",
  ai: "bg-ai/10 text-ai dark:bg-ai/15",
  warning: "bg-warning/15 text-warning",
} as const

export type IconTileTone = keyof typeof semanticTones | CategoryColorName

/**
 * An icon on a soft tinted tile: the visual anchor of a list row, so the eye
 * finds the row by colour and shape before reading it. `tone` is a category's
 * colour or a meaning colour; `neutral` is a grey tile.
 */
export function IconTile({
  icon: Icon,
  tone = "neutral",
  size,
  shape,
  className,
}: { icon: LucideIcon; tone?: IconTileTone; className?: string } & VariantProps<typeof iconTileVariants>) {
  const toneClassName =
    tone in semanticTones
      ? semanticTones[tone as keyof typeof semanticTones]
      : getCategoryColor(tone as CategoryColorName).surfaceClassName

  return (
    <span data-slot="icon-tile" data-size={size ?? "md"} aria-hidden="true" className={cn(iconTileVariants({ size, shape }), toneClassName, className)}>
      <Icon />
    </span>
  )
}
