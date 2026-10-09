"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, InfoIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react"

/**
 * Toasts as an island at the top, like iOS's Dynamic Island (chosen
 * 2026-10-09), the opposite of the page: black on the light theme, white on
 * the dark one. Every kind the same size, 52 high and 320 wide (less on a
 * narrow screen), whatever its text. The status glyph sits bare in its
 * meaning colour (success in the island's lime); the title takes up to two
 * lines, or one above a one-line description, cut with "…"; an action such
 * as Hoàn tác is lime text at the end. Sonner keeps the behaviour
 * (stacking, swipe to dismiss, timers).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckIcon className="text-island-accent" strokeWidth={3} />,
        info: <InfoIcon className="text-transfer" strokeWidth={2.5} />,
        warning: <TriangleAlertIcon className="text-warning" strokeWidth={2.5} />,
        error: <XIcon className="text-expense" strokeWidth={3} />,
        loading: <Loader2Icon className="animate-spin text-island-foreground/70" strokeWidth={2.5} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "inset-x-0 mx-auto flex h-13 w-80! max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full bg-island pr-2 pl-5 font-sans text-sm text-island-foreground shadow-[0_10px_40px_rgb(0_0_0/0.3)] has-[[data-icon]]:pl-4",
          icon: "flex size-6 shrink-0 items-center justify-center [&_svg]:size-5",
          content: "flex min-w-0 flex-1 flex-col justify-center pr-2",
          // Two lines alone; one above a description, so the island never grows.
          title: "line-clamp-2 leading-[18px] font-medium [[data-content]:has([data-description])>&]:line-clamp-1",
          // Sonner colours descriptions per theme on its own; keep them on the island's colour.
          description: "truncate text-xs leading-4 text-island-foreground/55!",
          actionButton: "-ml-1 h-9 shrink-0 rounded-full px-3 text-sm font-semibold text-island-accent",
          cancelButton: "-ml-1 h-9 shrink-0 rounded-full px-3 text-sm font-medium text-island-foreground/60",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
