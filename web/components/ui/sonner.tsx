"use client"

import type * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckIcon, InfoIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react"

/** The round badge leading a toast: white glyph on the toast's meaning colour. */
function ToastIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`grid size-6 place-items-center rounded-full text-white [&_svg]:size-3.5 ${className}`}>
      {children}
    </span>
  )
}

/**
 * Toasts as in the mockup, like an iOS banner rather than a web alert: a dark
 * pill (light in the dark theme) as wide as its text, centred at the top,
 * a round coloured badge with the status glyph on the left, a soft shadow.
 * Sonner keeps the behaviour (stacking, swipe to dismiss, timers, Undo).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <ToastIcon className="bg-income">
            <CheckIcon strokeWidth={3} />
          </ToastIcon>
        ),
        info: (
          <ToastIcon className="bg-transfer">
            <InfoIcon strokeWidth={2.5} />
          </ToastIcon>
        ),
        warning: (
          <ToastIcon className="bg-warning">
            <TriangleAlertIcon strokeWidth={2.5} />
          </ToastIcon>
        ),
        error: (
          <ToastIcon className="bg-destructive">
            <XIcon strokeWidth={3} />
          </ToastIcon>
        ),
        loading: (
          <ToastIcon className="bg-primary-foreground/15 text-primary-foreground">
            <Loader2Icon className="animate-spin" />
          </ToastIcon>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "inset-x-0 mx-auto flex w-max! max-w-full items-center font-sans gap-2.5 rounded-[26px] bg-primary py-2.5 pr-5 pl-5 text-sm text-primary-foreground shadow-[0_10px_40px_rgb(0_0_0/0.25)] has-[[data-icon]]:pl-2.5 sm:max-w-md",
          icon: "flex shrink-0 items-center justify-center",
          content: "flex min-w-0 flex-col",
          title: "leading-5 font-medium",
          // Sonner colours descriptions per theme on its own; keep them on the pill's colour.
          description: "text-xs leading-4 text-primary-foreground/60!",
          actionButton:
            "-mr-2.5 ml-1 h-8 shrink-0 rounded-full bg-primary-foreground/15 px-3 text-xs font-medium text-primary-foreground",
          cancelButton:
            "ml-1 h-8 shrink-0 rounded-full px-3 text-xs font-medium text-primary-foreground opacity-70",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
