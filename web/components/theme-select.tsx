"use client"

import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const subscribe = () => () => {}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const value = mounted && (theme === "light" || theme === "dark" || theme === "system")
    ? theme
    : "system"
  const currentLabel = value === "light" ? "Sáng" : value === "dark" ? "Tối" : "Theo hệ thống"

  React.useEffect(() => {
    if (mounted) {
      document.documentElement.dataset.themeSelection = value
    }
  }, [mounted, value])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Giao diện: ${currentLabel}`}
          title={`Giao diện: ${currentLabel}`}
        >
          {/* The provider sets this CSS selector before paint, before hydration knows the theme. */}
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextTheme) => {
            document.documentElement.dataset.themeSelection = nextTheme
            setTheme(nextTheme)
          }}
        >
          <DropdownMenuRadioItem value="light">
            <SunIcon />
            Sáng
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon />
            Tối
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon />
            Theo hệ thống
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
