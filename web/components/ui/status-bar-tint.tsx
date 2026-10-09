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
 * Dims the status bar along with the content while an overlay fades in and
 * out. Put it inside an overlay (the layer under a drawer, sheet or dialog)
 * whose dim is on ::before.
 *
 * Safari 26 ignores theme-color and tints the status bar with the
 * background-color of a fixed element at the screen's top edge. It does not
 * see the veil's fade (an opacity), so the bar jumped to the dimmed colour
 * when a sheet opened and back only once the veil was gone. This strip is
 * that element: every frame while the veil animates, its colour is the app's
 * background under the veil's dim at the veil's current opacity, so the bar
 * darkens and clears in step with the content. Same colour as the dimmed page
 * beneath it, so it is not seen. Outside the overlay (a portal), so the
 * veil's own opacity does not fade it twice. Phones only.
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

    const dim = alphaOf(getComputedStyle(overlay, "::before").backgroundColor)
    let frame = 0
    const paint = () => {
      const opacity = Number.parseFloat(getComputedStyle(overlay).opacity) || 0
      const percent = Math.round(dim * opacity * 1000) / 10
      strip.style.backgroundColor = `color-mix(in srgb, var(--background), black ${percent}%)`
      // Keep following while the veil animates (opening, closing); one more
      // frame after, so the last value is painted too.
      frame = overlay.getAnimations().length > 0 ? requestAnimationFrame(paint) : 0
    }
    const follow = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    paint()
    follow()
    overlay.addEventListener("animationstart", follow)
    return () => {
      cancelAnimationFrame(frame)
      overlay.removeEventListener("animationstart", follow)
    }
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
