"use client"

import type * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, InfoIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react"

/**
 * Toasts as an island at the top, rounded 20 as an iOS notification (chosen
 * 2026-10-09), the opposite of the page: black on the light theme, white on
 * the dark one. Every kind the same size, whatever its text: 64 high, as
 * wide as the screen less 16 a side on phones, 400 on wider screens. The status glyph sits bare in its
 * meaning colour (success in the island's lime); the title takes up to two
 * lines, or one above a one-line description, cut with "…"; an action such
 * as Hoàn tác is lime text at the end. Sonner keeps the behaviour
 * (stacking, swipe to dismiss, timers).
 */
const Toaster = ({ style, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Sonner's column, 356 by default; on phones it spans the screen less its 16 offsets.
      style={{ "--width": "400px", ...style } as React.CSSProperties}
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
          // A min height, not a height: Sonner measures a toast at height auto to
          // lay out the expanded stack, and the content alone is at most 36 high.
          toast:
            "inset-x-0 mx-auto flex min-h-16 w-full! items-center gap-3 rounded-[20px] bg-island pr-2 pl-5 font-sans text-sm text-island-foreground shadow-[0_10px_40px_rgb(0_0_0/0.3)] has-[[data-icon]]:pl-4",
          // Relative: Sonner wraps the loading spinner in a layer centred on its
          // nearest positioned box, which was the whole toast.
          icon: "relative flex size-6 shrink-0 items-center justify-center [&_svg]:size-5",
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
