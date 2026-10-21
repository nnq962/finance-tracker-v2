"use client"

import type * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The bar of a screen pushed in from another page, as Settings is from the
 * overview's avatar (2026-10-19, after iOS's Apple Account screen): the same
 * bar the app's sheets open with (PageSheet's SheetBar), so a pushed screen
 * and a sheet read as one kind of thing: the round back button on the left
 * raised by the bar's soft shadow, the title 16 semibold centred, an empty
 * cell on the right to keep it centred, 8 below. No padding above: the shell
 * already keeps the page 16 under the safe area, where the sheet's bar has
 * its own 16 (so the button sits 16 from the top, 2026-10-19). Back goes
 * where the user came from, else to `fallbackHref`.
 */
/**
 * Whether back stays in the app (2026-10-21). The Navigation API lists only
 * this site's entries, so one before the current is ours; history.length
 * also counts pages of other sites, where back would leave the app. Without
 * the API (older Safari), history.length as before.
 */
function canGoBackInApp() {
  const navigation = (window as Window & { navigation?: { currentEntry?: { index: number } | null } }).navigation
  if (navigation?.currentEntry) return navigation.currentEntry.index > 0
  return window.history.length > 1
}

export function ScreenHeader({
  title,
  backLabel = "Quay lại",
  fallbackHref = "/overview",
}: {
  title: React.ReactNode
  /** Names the back button for screen readers, e.g. the page it returns to. */
  backLabel?: string
  /** Where back goes when the screen was opened on its own (a link, the home screen). */
  fallbackHref?: string
}) {
  const router = useRouter()

  return (
    <header data-slot="screen-header" className="grid h-13 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 pb-2">
      <Button
        type="button"
        variant="elevated"
        size="icon"
        aria-label={backLabel}
        onClick={() => (canGoBackInApp() ? router.back() : router.push(fallbackHref))}
      >
        <ChevronLeftIcon />
      </Button>
      <h1 className="min-w-0 truncate text-center font-heading text-base font-semibold">{title}</h1>
      <span aria-hidden="true" />
    </header>
  )
}
