"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/**
 * Light or dark, as websites have it (2026-10-10; the third choice, following
 * the device, stays in Settings for the app on a phone). The icon shows the
 * theme in use, from the html's dark class, so it is right before hydration;
 * a tap turns to the other and keeps it. `variant="elevated"`: the white
 * round button, beside the bell at the top of Tổng quan on phones (2026-10-19).
 */
export function ThemeToggle({ size = "icon-sm", variant = "ghost" }: { size?: "icon" | "icon-sm"; variant?: "ghost" | "elevated" }) {
  const { setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label="Đổi giao diện sáng, tối"
      title="Đổi giao diện sáng, tối"
      onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
    >
      {/* Both drawn, one over the other: the one leaving shrinks, blurs and fades as the other comes in. The box takes the icons' size (the button sets it), so they stay centred. */}
      <span className="relative grid place-items-center [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:transition-[opacity,filter,scale] [&>svg]:duration-300 [&>svg]:ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:[&>svg]:transition-none">
        <SunIcon className="scale-100 opacity-100 blur-none dark:scale-25 dark:opacity-0 dark:blur-[4px]" />
        <MoonIcon className="scale-25 opacity-0 blur-[4px] dark:scale-100 dark:opacity-100 dark:blur-none" />
      </span>
    </Button>
  )
}
