"use client"

import * as React from "react"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"

export const themeOptions = [
  { value: "light", label: "Sáng", icon: SunIcon },
  { value: "dark", label: "Tối", icon: MoonIcon },
  { value: "system", label: "Theo hệ thống", icon: MonitorIcon },
] as const

export type ThemeValue = (typeof themeOptions)[number]["value"]

const subscribe = () => () => {}

/** The saved theme choice; "system" until mounted, as on the server. */
export function useThemeChoice() {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const choice: ThemeValue =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system"

  const choose = (next: ThemeValue) => {
    // Read by CSS to show the matching theme icon (see globals.css).
    document.documentElement.dataset.themeSelection = next
    setTheme(next)
  }

  return { choice, choose }
}

export function ThemeOptions() {
  const { choice, choose } = useThemeChoice()

  return (
    <SettingsGroup>
      {themeOptions.map(({ value, label, icon }) => (
        <SettingsRow
          key={value}
          icon={icon}
          color="violet"
          title={label}
          action={
            value === choice ? (
              <CheckIcon className="size-4 text-[#0083c4] dark:text-[#78d0ff]" aria-label="Đang chọn" />
            ) : null
          }
          chevron={false}
          onClick={() => choose(value)}
        />
      ))}
    </SettingsGroup>
  )
}
