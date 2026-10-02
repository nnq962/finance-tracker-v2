"use client"

import {
  ThemeTogglerButton,
  type ThemeTogglerButtonProps,
} from "@/components/animate-ui/components/buttons/theme-toggler"

const variant: ThemeTogglerButtonProps["variant"] = "ghost"
const size: ThemeTogglerButtonProps["size"] = "xs"
const direction: ThemeTogglerButtonProps["direction"] = "ltr"

export function ThemeToggle() {
  return (
    <ThemeTogglerButton
      variant={variant}
      size={size}
      direction={direction}
      modes={["light", "dark", "system"]}
      onImmediateChange={(theme) => {
        document.documentElement.dataset.themeSelection = theme
      }}
      aria-label="Đổi giao diện"
      title="Đổi giao diện"
    />
  )
}
