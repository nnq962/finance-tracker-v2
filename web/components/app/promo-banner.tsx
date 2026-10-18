import { ChevronRightIcon, type LucideIcon } from "lucide-react"

import { IconTile, type IconTileTone } from "@/components/app/icon-tile"
import { cn } from "@/lib/utils"

/**
 * A light card for one thing worth the user's attention, such as Pro: a
 * tinted icon, a title and a line, and an arrow. Light so it does not compete
 * with the page's lead card, the only dark one.
 */
export function PromoBanner({
  icon,
  tone = "ai",
  title,
  description,
  onClick,
  className,
}: {
  icon: LucideIcon
  /** The icon tile's colour. */
  tone?: IconTileTone
  title: string
  description?: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      data-slot="promo-banner"
      onClick={onClick}
      className={cn(
        "pressable flex w-full items-center gap-4 rounded-[20px] bg-card p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <IconTile icon={icon} tone={tone} size="lg" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )
}
