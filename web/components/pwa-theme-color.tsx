"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { useThemeColorSurface } from "@/lib/theme-color"

// theme-color is read by the browser, not from CSS, so these repeat the
// tokens as hex: the page (background), a sheet (popover), and the page
// under the bg-black/30 backdrop of a sheet or dialog.
const SURFACE_COLORS = {
  page: { light: "#f2f2f4", dark: "#000000" },
  sheet: { light: "#ffffff", dark: "#252527" },
  dimmed: { light: "#a9a9ab", dark: "#000000" },
} as const

/** Keeps the phone's status bar the colour of whatever covers the top of the screen. */
export function PwaThemeColor() {
  const { resolvedTheme } = useTheme()
  const surface = useThemeColorSurface()

  React.useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return

    const color = SURFACE_COLORS[surface][resolvedTheme]

    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color))
  }, [resolvedTheme, surface])

  return null
}
