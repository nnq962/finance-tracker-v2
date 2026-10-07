"use client"

import * as React from "react"
import { useTheme } from "next-themes"

// theme-color is read by the browser, not from CSS, so it repeats the
// background token as hex. Screen sheets share the page's grey, so the
// status bar never has to change while one slides in.
const APP_BACKGROUND = {
  light: "#f2f2f1",
  dark: "#0a0a0a",
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
