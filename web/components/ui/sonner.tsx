"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          fontFamily: "var(--font-be-vietnam-pro), sans-serif",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-2xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // One white toast for every kind; only the icon carries the colour.
          toast: "cn-toast font-sans !border-0 !bg-popover !text-popover-foreground !shadow-[0_12px_32px_-8px_rgb(0_0_0/0.2),0_0_0_1px_rgb(0_0_0/0.04)] dark:!shadow-[0_12px_32px_-8px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.06)]",
          title: "!font-medium !leading-snug",
          description: "!leading-normal !text-muted-foreground",
          actionButton: "!rounded-full !bg-primary !px-3 !font-semibold !text-primary-foreground",
          cancelButton: "!rounded-full !bg-secondary !px-3 !font-semibold !text-secondary-foreground",
          success: "[&_[data-icon]]:!text-income",
          info: "[&_[data-icon]]:!text-transfer",
          warning: "[&_[data-icon]]:!text-amber-500",
          error: "[&_[data-icon]]:!text-expense",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
