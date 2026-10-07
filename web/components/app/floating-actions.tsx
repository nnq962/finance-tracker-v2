import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A page's main actions on phones, floating at the bottom right just above
 * the tab bar (--tab-bar-space, set on the app shell), within thumb reach
 * while the page scrolls. Stacked bottom up, the main action last; the page
 * keeps room at its end so the last rows scroll clear of them. From md up
 * pages show their actions in the header instead, so this hides.
 */
export function FloatingActions({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true" data-slot="floating-actions-spacer" className="h-16 md:hidden" />
      <div
        data-slot="floating-actions"
        className={cn(
          // A soft shadow lifts the buttons off the content scrolling below.
          "pointer-events-none fixed right-4 bottom-[calc(var(--tab-bar-space)+0.75rem)] z-30 flex flex-col items-end gap-3 drop-shadow-lg md:hidden *:pointer-events-auto",
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}
