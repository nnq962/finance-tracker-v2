"use client"

import * as React from "react"
import { createPortal } from "react-dom"

/** The dim's opacity from a colour such as "oklab(0 0 0 / 0.3)" or "rgba(0, 0, 0, 0.3)". */
function alphaOf(color: string) {
  const match = color.match(/\/\s*([\d.]+%?)\s*\)$/) ?? color.match(/,\s*([\d.]+)\s*\)$/)
  if (!match) return 0
  return match[1].endsWith("%") ? Number.parseFloat(match[1]) / 100 : Number.parseFloat(match[1])
}

/**
 * Gives the status bar the dimmed page's colour while an overlay is open. Put
 * it inside an overlay (the layer under a drawer, sheet or dialog) whose dim
 * is on ::before.
 *
 * Safari 26 ignores theme-color and tints the status bar with the
 * background-color of a fixed element at the screen's top edge. It skips the
 * veil (its dim is on ::before), so this strip is that element: the app's
 * background under the veil's dim, the colour of the page beneath it. Safari
 * takes a new colour for the bar only now and then, once an animation has
 * finished, not while the veil fades: on an iPhone (2026-10-09, the lab at
 * /design/status-bar) a strip recoloured every frame, every second, or with
 * a 1px scroll each time left the bar unchanged. So the bar cannot dim along
 * with the content; it switches once, after the veil has faded in or out,
 * and the strip takes its final colour at once. Outside the overlay (a
 * portal), so the veil's opacity does not fade it. Phones only.
 */
export function StatusBarTint() {
  const markerRef = React.useRef<HTMLSpanElement>(null)
  const stripRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const overlay = markerRef.current?.parentElement
    const strip = stripRef.current
    if (!mounted || !overlay || !strip) return

    const percent = Math.round(alphaOf(getComputedStyle(overlay, "::before").backgroundColor) * 1000) / 10
    strip.style.backgroundColor = `color-mix(in srgb, var(--background), black ${percent}%)`
  }, [mounted])

  return (
    <>
      <span ref={markerRef} hidden />
      {mounted
        ? createPortal(
            <div
              ref={stripRef}
              aria-hidden="true"
              data-slot="status-bar-tint"
              className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[max(env(safe-area-inset-top,0px),1px)] bg-background md:hidden"
            />,
            document.body,
          )
        : null}
    </>
  )
}
