"use client"

import { useEffect } from "react"

/**
 * Keeps the page at its own scale, as in a native app. The viewport tag
 * stops pinch zoom on Android and `touch-action: manipulation` the
 * double-tap zoom everywhere, but Safari on iOS ignores the tag; its own
 * gesture events are what pinching starts there, so they are cancelled.
 */
export function PreventZoom() {
  useEffect(() => {
    const cancel = (event: Event) => event.preventDefault()
    const events = ["gesturestart", "gesturechange", "gestureend"] as const
    for (const name of events) document.addEventListener(name, cancel, { passive: false })
    return () => {
      for (const name of events) document.removeEventListener(name, cancel)
    }
  }, [])

  return null
}
