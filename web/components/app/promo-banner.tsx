import { ChevronRightIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A dark banner for one thing worth the user's attention, such as Pro: an
 * icon, a title and a line, and a round arrow. It is light in the dark theme.
 */
export function PromoBanner({
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: {
  icon: LucideIcon
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
        "pressable relative flex w-full items-center gap-4 overflow-hidden rounded-[20px] bg-linear-to-r from-primary via-primary to-primary/85 px-6 py-5 text-left text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {/* A dotted texture, fading out at both ends. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-15 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:10px_10px] [mask-image:linear-gradient(90deg,transparent,black_40%,transparent)]"
      />
      <Icon aria-hidden="true" className="relative size-7 shrink-0 text-ai" strokeWidth={1.7} />
      <span className="relative min-w-0 flex-1">
        <span className="block text-lg font-semibold">{title}</span>
        {description ? <span className="block text-sm opacity-60">{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="relative grid size-11 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary"
      >
        <ChevronRightIcon className="size-5" strokeWidth={1.7} />
      </span>
    </button>
  )
}
