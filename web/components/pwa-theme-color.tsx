"use client"

import * as React from "react"
import { useTheme } from "next-themes"

const APP_BACKGROUND = {
  light: "#f2f2f4",
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
