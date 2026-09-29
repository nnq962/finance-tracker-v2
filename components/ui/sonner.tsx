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
          fontFamily: "var(--font-nunito), sans-serif",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !border-2 font-sans",
          title: "!font-medium !leading-snug",
          description: "!font-medium !leading-normal",
          actionButton:
            "font-heading !font-extrabold tracking-[0.06em] uppercase",
          cancelButton:
            "font-heading !font-extrabold tracking-[0.06em] uppercase",
          default:
            "!border-[#e7e4dd] !bg-white !text-[#2b2a33] dark:!border-[#35323e] dark:!bg-[#201e26] dark:!text-[#f2f0f6]",
          loading:
            "!border-[#e7e4dd] !bg-white !text-[#2b2a33] dark:!border-[#35323e] dark:!bg-[#201e26] dark:!text-[#f2f0f6]",
          success:
            "!border-[oklch(0.84_0.10_138)] !bg-[oklch(0.95_0.06_138)] !text-[oklch(0.52_0.17_140)] dark:!border-[oklch(0.42_0.09_138)] dark:!bg-[oklch(0.30_0.07_138)] dark:!text-[oklch(0.82_0.15_138)]",
          info:
            "!border-[oklch(0.82_0.07_235)] !bg-[oklch(0.95_0.04_235)] !text-[oklch(0.52_0.14_240)] dark:!border-[oklch(0.42_0.08_235)] dark:!bg-[oklch(0.30_0.06_235)] dark:!text-[oklch(0.82_0.10_235)]",
          warning:
            "!border-[oklch(0.86_0.10_85)] !bg-[oklch(0.96_0.06_85)] !text-[oklch(0.58_0.15_70)] dark:!border-[oklch(0.44_0.09_85)] dark:!bg-[oklch(0.32_0.07_85)] dark:!text-[oklch(0.88_0.13_85)]",
          error:
            "!border-[oklch(0.84_0.09_25)] !bg-[oklch(0.95_0.04_25)] !text-[oklch(0.52_0.18_25)] dark:!border-[oklch(0.42_0.10_25)] dark:!bg-[oklch(0.30_0.07_25)] dark:!text-[oklch(0.82_0.13_25)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
