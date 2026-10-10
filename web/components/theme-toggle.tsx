"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/**
 * Light or dark, as websites have it (2026-10-10; the third choice, following
 * the device, stays in Settings for the app on a phone). The icon shows the
 * theme in use, from the html's dark class, so it is right before hydration;
 * a tap turns to the other and keeps it.
 */
export function ThemeToggle({ size = "icon-sm" }: { size?: "icon" | "icon-sm" }) {
  const { setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      aria-label="Đổi giao diện sáng, tối"
      title="Đổi giao diện sáng, tối"
      onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
    >
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
    </Button>
  )
}
