"use client"

import * as React from "react"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export const themeOptions = [
  { value: "light", label: "Sáng", icon: SunIcon },
  { value: "dark", label: "Tối", icon: MoonIcon },
  { value: "system", label: "Tự động", icon: MonitorIcon },
] as const

export type ThemeValue = (typeof themeOptions)[number]["value"]

const subscribe = () => () => {}

/** The saved theme choice; "system" until mounted, as on the server. */
export function useThemeChoice() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const choice: ThemeValue =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system"
  // What shows now: the choice, or the device's with Tự động.
  const shown: "light" | "dark" = mounted && resolvedTheme === "dark" ? "dark" : "light"

  const choose = (next: ThemeValue) => {
    // Read by CSS to show the matching theme icon (see globals.css).
    document.documentElement.dataset.themeSelection = next
    setTheme(next)
  }

  return { choice, shown, choose }
}

/**
 * A screen of the app drawn small in one theme, whatever the page's: its
 * colours come from the theme's own tokens (`.light` / `.dark` on it).
 */
function ThemePreview({ theme }: { theme: "light" | "dark" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        theme,
        "flex h-36 w-20 flex-col gap-1.5 overflow-hidden rounded-[16px] bg-background p-2 ring-1 ring-foreground/10",
      )}
    >
      <span className="h-1.5 w-8 rounded-full bg-foreground/80" />
      <span className="flex h-8 flex-col justify-end gap-1 rounded-[8px] bg-inverse p-1.5">
        <span className="h-1 w-6 rounded-full bg-inverse-foreground/50" />
        <span className="h-1.5 w-10 rounded-full bg-inverse-foreground" />
      </span>
      <span className="flex flex-col gap-1.5 rounded-[8px] bg-card p-1.5">
        {[0, 1, 2].map((row) => (
          <span key={row} className="flex items-center gap-1">
            <span className="size-2.5 rounded-[4px] bg-foreground/15" />
            <span className="h-1 flex-1 rounded-full bg-foreground/25" />
          </span>
        ))}
      </span>
    </span>
  )
}

/**
 * The look, as iOS's Display & Brightness: the light and the dark screen
 * side by side, the one showing ticked; a tap picks it. Under them Tự động
 * follows the device's setting, the screens then ticking whichever it is.
 */
// How long the switch's knob takes to slide (Switch: 500ms).
const SWITCH_SLIDE_MS = 500

export function ThemeOptions() {
  const { choice, shown, choose } = useThemeChoice()
  // The switch moves at once; the theme follows once its knob has slid, as
  // changing the theme stops every transition for a moment (no colours
  // fading across the app) and would cut the slide short.
  const [autoPending, setAutoPending] = React.useState<boolean | null>(null)
  const timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  const setAuto = (on: boolean) => {
    const next = on ? "system" : shown
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return choose(next)
    setAutoPending(on)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      choose(next)
      setAutoPending(null)
    }, SWITCH_SLIDE_MS)
  }

  return (
    <SettingsGroup
      header={
        <div role="radiogroup" aria-label="Giao diện" className="grid grid-cols-2 gap-4 px-6 pt-6 pb-5">
          {(["light", "dark"] as const).map((theme) => {
            const checked = shown === theme
            return (
              <button
                key={theme}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => choose(theme)}
                className="pressable flex flex-col items-center gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <ThemePreview theme={theme} />
                <span className="text-sm font-medium">{theme === "light" ? "Sáng" : "Tối"}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 place-items-center rounded-full",
                    checked ? "bg-primary text-primary-foreground" : "ring-[1.5px] ring-foreground/25 ring-inset",
                  )}
                >
                  {checked ? <CheckIcon className="size-3.5" strokeWidth={3} /> : null}
                </span>
              </button>
            )
          })}
        </div>
      }
      // The screens' inset divider above the row too.
      listClassName="relative before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-border"
    >
      <SettingsRow
        title="Tự động"
        description="Theo cài đặt sáng tối của máy"
        action={
          <Switch
            aria-label="Tự động theo máy"
            checked={autoPending ?? choice === "system"}
            // Off keeps what shows now, as iOS does.
            onCheckedChange={setAuto}
          />
        }
      />
    </SettingsGroup>
  )
}
