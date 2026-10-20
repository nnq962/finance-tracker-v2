"use client"

import type * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, CircleAlertIcon, InfoIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react"

/**
 * Toasts as a white card at the top (2026-10-17, after the black island of
 * 2026-10-09): the card's white on the light theme, iOS's raised grey on the
 * dark one, lifted by a hairline edge and a shadow (`shadow-toast`). Every
 * kind the same size, whatever its text, the island's (kept on 2026-10-17
 * after a day at 52): 64 high, as wide as the screen less 16 a side on
 * phones, 400 on wider screens, rounded 20. The status sits in a 32 tile
 * tinted with its meaning colour; the title takes up to two lines, or one
 * above a one-line description, cut with "…"; an action such as Hoàn tác is a
 * primary button rounded 12, set in from the right edge by 14, as far as
 * from the top and bottom (2026-10-17). The shadow falls below it only: a wide one reached the top of the
 * screen, and Safari 26 tinted the status bar from it. Sonner keeps the
 * behaviour (stacking, swipe to dismiss, timers) and the slide.
 */
const tile = "flex size-8 items-center justify-center rounded-[10px] [&_svg]:size-[18px]"

const Toaster = ({ style, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Sonner's column, 356 by default; on phones it spans the screen less its 16 offsets.
      style={{ "--width": "400px", ...style } as React.CSSProperties}
      icons={{
        success: (
          <span className={`${tile} bg-income/15 text-income`}>
            <CheckIcon strokeWidth={3} />
          </span>
        ),
        info: (
          <span className={`${tile} bg-transfer/15 text-transfer`}>
            <InfoIcon strokeWidth={2.5} />
          </span>
        ),
        warning: (
          <span className={`${tile} bg-warning/18 text-warning-text`}>
            <TriangleAlertIcon strokeWidth={2.5} />
          </span>
        ),
        error: (
          <span className={`${tile} bg-expense/15 text-expense`}>
            <CircleAlertIcon strokeWidth={2.5} />
          </span>
        ),
        loading: (
          <span className={`${tile} bg-muted text-muted-foreground`}>
            <Loader2Icon className="animate-spin" strokeWidth={2.5} />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // A min height, not a height: Sonner measures a toast at height auto to
          // lay out the expanded stack, and the content alone is at most 36 high.
          // Stacked behind the front one, only its edge shows, not its words.
          toast:
            "inset-x-0 mx-auto flex min-h-16 w-full! items-center gap-3 rounded-[20px] bg-card pr-2 pl-5 font-sans text-sm text-card-foreground shadow-toast has-[[data-icon]]:pl-4 has-[[data-action]]:pr-3.5 dark:bg-secondary [&>*]:transition-opacity [&>*]:duration-400 data-[expanded=false]:data-[front=false]:[&>*]:opacity-0",
          // Sonner's own box around the icon is 16 square, with margins; it
          // also wraps the loading spinner in a layer centred on the nearest
          // positioned box, which was the whole toast.
          icon: "relative m-0! flex size-8! shrink-0 items-center justify-center",
          content: "flex min-w-0 flex-1 flex-col justify-center gap-px pr-2",
          // Two lines alone; one above a description, so the toast never grows.
          title: "line-clamp-2 leading-[18px] font-semibold [[data-content]:has([data-description])>&]:line-clamp-1",
          // Sonner colours descriptions per theme on its own; keep them muted.
          description: "truncate text-xs leading-4 text-muted-foreground!",
          actionButton:
            "-ml-1 h-9 shrink-0 rounded-[12px] bg-primary px-3.5 text-sm font-semibold text-primary-foreground active:opacity-80",
          cancelButton: "-ml-1 h-9 shrink-0 rounded-[12px] px-3 text-sm font-medium text-muted-foreground active:opacity-80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
