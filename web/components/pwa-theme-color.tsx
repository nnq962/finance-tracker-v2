"use client"

import * as React from "react"
import { useTheme } from "next-themes"

const APP_BACKGROUND = {
  light: "#fbfaf7",
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
