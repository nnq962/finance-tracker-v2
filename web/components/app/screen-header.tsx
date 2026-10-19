"use client"

import type * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The bar of a screen pushed in from another page, as Settings is from the
 * overview's avatar (2026-10-19, after iOS's Apple Account screen): the same
 * bar the app's sheets open with (PageSheet's SheetBar), so a pushed screen
 * and a sheet read as one kind of thing. 68 high with 16 above and 8 below,
 * the round back button on the left raised by the bar's soft shadow, the
 * title 16 semibold centred, an empty cell on the right to keep it centred.
 * Back goes where the user came from, else to `fallbackHref`.
 */
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
    <header data-slot="screen-header" className="grid h-17 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 pt-4 pb-2">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={backLabel}
        className="shadow-[0_4px_16px_rgb(0_0_0/0.1)]"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref))}
      >
        <ChevronLeftIcon />
      </Button>
      <h1 className="min-w-0 truncate text-center font-heading text-base font-semibold">{title}</h1>
      <span aria-hidden="true" />
    </header>
  )
}
