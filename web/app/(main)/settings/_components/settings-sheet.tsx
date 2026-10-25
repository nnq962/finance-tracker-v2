"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { PageSheet } from "@/components/app/page-sheet"

/** How long the sheet takes to slide down before the page under it takes the address back. */
const CLOSE_MS = 350

/**
 * Settings opened from inside the app on a phone (2026-10-25): not a pushed
 * page but a sheet over the page it was opened from, as iOS apps open their
 * settings, with Settings' own screens pushed into it. The address is still
 * /settings, so a refresh or a shared link opens the page; closing slides the
 * sheet down, then goes back to the page under it. From md up Settings stays
 * a page, so a wide window opening it here loads the page instead.
 */
export function SettingsSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const closing = React.useRef(false)

  React.useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      window.location.reload()
      return
    }
    // Opened a frame after mounting, so it rises rather than appearing in place.
    const frame = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <>
      {/* What Next scrolls into view on arriving here is the slot's first element: this
          one, already in view, so it scrolls nothing. Else it found the sheet's
          content still below the screen and scrolled it under the bar. */}
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 size-px" />
      <PageSheet
        title="Cài đặt"
        open={open}
        onOpenChange={(next) => {
          if (next || closing.current) return
          closing.current = true
          setOpen(false)
          window.setTimeout(() => router.back(), CLOSE_MS)
        }}
      >
        {children}
      </PageSheet>
    </>
  )
}
