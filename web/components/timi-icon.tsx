import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Timi's icon in the app, following the app's theme (2026-10-13): the ink
 * tile on light, the white tile with ink bars on dark, where the ink tile
 * would sink into the background (docs/brand). Size and place it with
 * `className` (size-10, md:hidden…). The favicon and the installed app's
 * icon stay the ink tile: they do not follow the app's theme.
 */
export function TimiIcon({ size, priority, className }: { size: number; priority?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} aria-hidden="true">
      <Image src="/icon.svg" alt="" width={size} height={size} priority={priority} className="size-full dark:hidden" />
      <Image src="/icon-dark.svg" alt="" width={size} height={size} priority={priority} className="hidden size-full dark:block" />
    </span>
  )
}
