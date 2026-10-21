"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * A page's main actions on phones, floating at the bottom right just above
 * the tab bar (--tab-bar-space, set on the app shell), within thumb reach
 * while the page scrolls. Stacked bottom up, the main action last; the page
 * keeps room at its end so the last rows scroll clear of them. From md up
 * pages show their actions in the header instead, so this hides.
 * `concealed` slides them down out of the way for a while (a search).
 * `hideOnScroll` slides them away while the page scrolls down and back as
 * soon as it scrolls up, as iOS Mail's compose button: over a list whose
 * amounts sit on the right (the transactions), the + no longer covers them
 * while reading down (2026-10-21).
 */
export function FloatingActions({
  concealed = false,
  hideOnScroll = false,
  className,
  children,
}: {
  /** Slid down out of the way and inert, e.g. while the page searches; back when false. */
  concealed?: boolean
  /** Away while scrolling down, back on scrolling up or at the top. */
  hideOnScroll?: boolean
  className?: string
  children: React.ReactNode
}) {
  const [scrolledAway, setScrolledAway] = React.useState(false)
  React.useEffect(() => {
    if (!hideOnScroll) return
    const viewport = document.querySelector<HTMLElement>("[data-main-scroll-viewport]")
    if (!viewport) return
    let last = viewport.scrollTop
    const onScroll = () => {
      const top = viewport.scrollTop
      // A few pixels of give, so a finger resting on the list does not flicker it.
      if (Math.abs(top - last) < 8) return
      setScrolledAway(top > last && top > 64)
      last = top
    }
    viewport.addEventListener("scroll", onScroll, { passive: true })
    return () => viewport.removeEventListener("scroll", onScroll)
  }, [hideOnScroll])
  concealed = concealed || scrolledAway
  return (
    <>
      <div aria-hidden="true" data-slot="floating-actions-spacer" className="h-16 md:hidden" />
      <div
        data-slot="floating-actions"
        inert={concealed}
        className={cn(
          // A soft shadow lifts the buttons off the content scrolling below.
          "pointer-events-none fixed right-4 bottom-[calc(var(--tab-bar-space)+0.75rem)] z-30 flex flex-col items-end gap-3 drop-shadow-lg transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none md:hidden *:pointer-events-auto",
          concealed && "translate-y-[calc(var(--tab-bar-space)+5rem)] opacity-0",
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}

/**
 * A page's floating + in its loading state, in place so it does not pop in
 * when the page arrives; inert until then. Not `disabled`: its dimmed look
 * would itself change when the page loads.
 */
export function FloatingActionsSkeleton() {
  return (
    <FloatingActions>
      <Button type="button" size="fab" tabIndex={-1} aria-hidden="true">
        <PlusIcon />
      </Button>
    </FloatingActions>
  )
}
