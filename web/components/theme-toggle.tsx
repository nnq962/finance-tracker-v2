"use client"

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

const modes = ["light", "dark", "system"] as const

/** Cycles light → dark → system. The icon follows html[data-theme-selection] via CSS, so it is right before hydration. */
export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Đổi giao diện"
      title="Đổi giao diện"
      onClick={() => {
        const current = document.documentElement.dataset.themeSelection
        const next = modes[(modes.indexOf(current as (typeof modes)[number]) + 1) % modes.length]
        document.documentElement.dataset.themeSelection = next
        setTheme(next)
      }}
    >
      <span data-theme-icon="light">
        <SunIcon />
      </span>
      <span data-theme-icon="dark">
        <MoonIcon />
      </span>
      <span data-theme-icon="system">
        <MonitorIcon />
      </span>
    </Button>
  )
}
