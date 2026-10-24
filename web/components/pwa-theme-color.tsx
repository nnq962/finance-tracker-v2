"use client"

import * as React from "react"
import { useTheme } from "next-themes"

// theme-color is read by the browser, not from CSS, so it repeats the
// background token as hex: the neutral grey page since 2026-10-23 (was white), black in the dark.
const APP_BACKGROUND = {
  light: "#f0f0f0",
  dark: "#000000",
} as const

export function PwaThemeColor() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return

    const color = APP_BACKGROUND[resolvedTheme]

    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color))
  }, [resolvedTheme])

  return null
}
