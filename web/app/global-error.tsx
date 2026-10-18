"use client"

import "./globals.css"

import * as React from "react"
import { Manrope } from "next/font/google"
import { RotateCcwIcon } from "lucide-react"

import { StatusScreen } from "@/components/app/status-screen"
import { TimiIcon } from "@/components/timi-icon"
import { TimiWordmark } from "@/components/timi-wordmark"
import { Button } from "@/components/ui/button"
import { useReportError } from "@/lib/sentry/report"

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin", "vietnamese"], display: "swap" })

// The root layout (and with it the theme) is gone here: the dark theme comes
// from what the user chose (next-themes keeps it as "theme"), read in the
// browser (a script in <head> would not run: React adds it after loading).
function prefersDark() {
  try {
    const theme = localStorage.getItem("theme")
    return theme === "dark" || ((!theme || theme === "system") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  } catch {
    return false
  }
}
const noSubscribe = () => () => {}

/**
 * The whole app failed, the root layout too: Timi's starting screen with a
 * reload (2026-10-18). Reloading rather than retry(), as nothing of the app
 * around it can be trusted.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error)
  const dark = React.useSyncExternalStore(noSubscribe, prefersDark, () => false)
  return (
    <html lang="vi" className={`${manrope.variable} h-full font-sans${dark ? " dark" : ""}`} suppressHydrationWarning>
      <head>
        <title>Timi gặp sự cố</title>
      </head>
      <body className="min-h-full">
        <StatusScreen
          media={
            <div className="flex flex-col items-center">
              <TimiIcon size={88} className="size-[88px]" />
              <TimiWordmark className="mt-6 block text-2xl" />
            </div>
          }
          title="Timi gặp sự cố"
          titleSize="md"
          description="Tải lại để tiếp tục. Dữ liệu của bạn vẫn an toàn, lỗi đã được ghi lại để sửa."
        >
          <Button size="lg" onClick={() => window.location.reload()}>
            <RotateCcwIcon />
            Tải lại
          </Button>
        </StatusScreen>
      </body>
    </html>
  )
}
