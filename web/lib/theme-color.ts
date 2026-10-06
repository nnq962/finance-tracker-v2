"use client"

import * as React from "react"

/**
 * What covers the top of the screen, which the phone's status bar (the PWA's
 * theme-color) should match: the page, or a white sheet filling the screen.
 * The change is instant, not animated, so sheets on the page's grey
 * (surface="grouped") avoid it; white screen sheets register while open.
 */
export type ThemeColorSurface = "page" | "sheet"

const stack: { surface: ThemeColorSurface }[] = []
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSurface(): ThemeColorSurface {
  return stack.at(-1)?.surface ?? "page"
}

/** The surface the status bar should match now. */
export function useThemeColorSurface() {
  return React.useSyncExternalStore(subscribe, getSurface, () => "page" as const)
}

/**
 * Claims the status bar for `surface` while the calling component is
 * mounted; with `media`, only while that media query matches at mount.
 * Call it from what exists only while the overlay is open.
 */
export function useClaimThemeColor(surface: ThemeColorSurface, media?: string) {
  React.useEffect(() => {
    if (media && !window.matchMedia(media).matches) return
    const entry = { surface }
    stack.push(entry)
    emit()
    return () => {
      stack.splice(stack.indexOf(entry), 1)
      emit()
    }
  }, [surface, media])
}

/** useClaimThemeColor as an element, to place inside an overlay's content. */
export function ClaimThemeColor({ surface, media }: { surface: ThemeColorSurface; media?: string }) {
  useClaimThemeColor(surface, media)
  return null
}
