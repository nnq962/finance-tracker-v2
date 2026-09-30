"use client"

import * as React from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    <Select
      value={value}
      onValueChange={(nextTheme) => {
        document.documentElement.dataset.themeSelection = nextTheme
        setTheme(nextTheme)
      }}
    >
      <SelectTrigger
        aria-label={`Giao diện: ${currentLabel}`}
        title={`Giao diện: ${currentLabel}`}
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className:
            "gap-0 border-transparent bg-transparent p-0 enabled:hover:border-transparent focus:border-transparent focus:bg-transparent focus:ring-0 focus-visible:ring-3 data-[state=open]:border-transparent data-[state=open]:bg-[#d6f4ff] data-[state=open]:ring-0 dark:border-transparent dark:bg-transparent dark:enabled:hover:border-transparent dark:focus:border-transparent dark:focus:bg-transparent dark:focus:ring-0 dark:data-[state=open]:border-transparent dark:data-[state=open]:bg-[#d6f4ff]/15 dark:data-[state=open]:ring-0 [&>svg]:hidden",
        })}
      >
        <span aria-hidden="true" className="flex size-4 items-center justify-center">
          {/* The provider sets this CSS selector before paint, before hydration knows the theme. */}
          <span data-theme-icon="light">
            <SunIcon className="size-4" />
          </span>
          <span data-theme-icon="dark">
            <MoonIcon className="size-4" />
          </span>
          <span data-theme-icon="system">
            <MonitorIcon className="size-4" />
          </span>
        </span>
        <span className="sr-only">
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="end" showScrollButtons={false}>
        <SelectGroup>
          <SelectItem value="light">
            <span className="flex items-center gap-2">
              <SunIcon className="size-4" />
              Sáng
            </span>
          </SelectItem>
          <SelectItem value="dark">
            <span className="flex items-center gap-2">
              <MoonIcon className="size-4" />
              Tối
            </span>
          </SelectItem>
          <SelectItem value="system">
            <span className="flex items-center gap-2">
              <MonitorIcon className="size-4" />
              Theo hệ thống
            </span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
