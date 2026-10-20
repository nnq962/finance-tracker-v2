import type { LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      // xs: beside a value at the end of a row (20, as AccountLogo xs); sm: a
      // list row's icon (36, as in the mockup's settings list); md: a
      // transaction or category row; lg: a card's or a sheet's lead.
      size: {
        xs: "size-5 [&_svg]:size-3",
        sm: "size-9 [&_svg]:size-[18px]",
        md: "size-10 [&_svg]:size-5",
        lg: "size-12 [&_svg]:size-6",
      },
      // rounded: the mockup's tile, a soft square; circle is kept for faces and initials.
      shape: {
        rounded: "rounded-[10px] data-[size=lg]:rounded-[16px] data-[size=xs]:rounded-[6px]",
        circle: "rounded-full",
      },
    },
    defaultVariants: { size: "md", shape: "rounded" },
  },
)

// Meaning colours, for tiles that are not about a category.
const semanticTones = {
  neutral: "bg-muted text-foreground",
  // A plain tile that shows on white and grey alike (a bg-field list, a chosen grid cell), where bg-muted vanishes.
  card: "bg-card text-foreground ring-1 ring-border ring-inset",
  income: "tile-tinted [--tile:var(--income)]",
  expense: "tile-tinted [--tile:var(--expense)]",
  transfer: "tile-tinted [--tile:var(--transfer)]",
  ai: "tile-tinted [--tile:var(--ai)]",
  warning: "tile-tinted [--tile:var(--warning)]",
} as const

export type IconTileTone = keyof typeof semanticTones | CategoryColorName

/**
 * An icon on a soft tile: the visual anchor of a list row, so the eye finds
 * the row by shape and a hint of colour before reading it. `tone` is a
 * category's colour or a meaning colour, toned down towards grey with the
 * icon in ink (tile-tinted), so a list reads calm rather than as a rainbow;
 * `neutral` is a grey tile (`card`, white with a fine line, where it may sit
 * on grey). `badge`: a short word on its top right corner, as on an app icon
 * ("Mới" for a category still to be made), in the AI's lime ringed in the
 * card's colour, standing out only a little so it stays clear of the text
 * beside or under the tile; a plain tile keeps it easy to read.
 */
export function IconTile({
  icon: Icon,
  tone = "neutral",
  size,
  shape,
  badge,
  className,
}: { icon: LucideIcon; tone?: IconTileTone; badge?: string; className?: string } & VariantProps<typeof iconTileVariants>) {
  const toneClassName =
    tone in semanticTones
      ? semanticTones[tone as keyof typeof semanticTones]
      : cn("tile-tinted", getCategoryColor(tone as CategoryColorName).tileClassName)

  const tile = (
    <span data-slot="icon-tile" data-size={size ?? "md"} aria-hidden="true" className={cn(iconTileVariants({ size, shape }), toneClassName, className)}>
      <Icon />
    </span>
  )
  if (!badge) return tile
  return (
    <span className="relative inline-flex shrink-0">
      {tile}
      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-ai px-1.5 text-[10px] leading-4 font-semibold whitespace-nowrap text-ai-foreground ring-2 ring-card">
        {badge}
      </span>
    </span>
  )
}
