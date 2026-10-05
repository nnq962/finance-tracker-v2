import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A page's main actions on phones, floating at the bottom right just above
 * the tab bar (--tab-bar-space, set on the app shell), within thumb reach
 * while the page scrolls. Stacked bottom up, the main action last. From md
 * up pages show their actions in the header instead, so this hides.
 */
export function FloatingActions({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        // A soft shadow lifts the buttons off the content scrolling below.
        "pointer-events-none fixed right-4 bottom-[calc(var(--tab-bar-space)+0.75rem)] z-30 flex flex-col items-end gap-3 drop-shadow-[0_8px_18px_rgb(0_0_0/0.2)] md:hidden *:pointer-events-auto",
        className,
      )}
    >
      {children}
    </div>
  )
}
