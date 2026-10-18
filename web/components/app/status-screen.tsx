"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { TimiIcon } from "@/components/timi-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * A screen of its own, laid out as the starting screen (app/loading.tsx):
 * Timi's mark a little above the middle, a title, a line under it, then the
 * way on, full width up to 320. For a page not found and for the whole app
 * failing (2026-10-18).
 */
export function StatusScreen({
  media = <TimiIcon size={88} className="size-[88px]" />,
  title,
  titleSize = "lg",
  description,
  children,
}: {
  /** Above the title; Timi's mark by default. */
  media?: React.ReactNode
  title: string
  /** lg: the screen's headline (a page not found); md: under Timi's name, which leads (the app failing). */
  titleSize?: "lg" | "md"
  description: React.ReactNode
  /** The buttons, stacked. */
  children?: React.ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col items-center bg-background px-6 pt-[28svh] pb-[calc(env(safe-area-inset-bottom,0px)+24px)] text-center text-foreground">
      {media}
      <h1 className={titleSize === "md" ? "mt-6 text-lg font-semibold" : "mt-8 text-2xl font-semibold"}>{title}</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      {children ? <div className="mt-8 flex w-full max-w-xs flex-col gap-2">{children}</div> : null}
    </main>
  )
}

/** Home, as a link (works without the app's code running). */
export function StatusHomeButton({ children = "Về Tổng quan" }: { children?: React.ReactNode }) {
  return (
    <Button size="lg" asChild>
      <Link href="/overview">{children}</Link>
    </Button>
  )
}

/** Back where the user came from, else home (a link opened on its own has nowhere to go back to). */
export function StatusBackButton() {
  const router = useRouter()
  return (
    <Button
      size="lg"
      variant="ghost"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/overview"))}
    >
      <ArrowLeftIcon />
      Quay lại
    </Button>
  )
}

/**
 * A page that failed to load, in place of its content inside the app (the
 * tab bar and the rest stay): a warning tile, what did not load, that the
 * user's data is untouched, and Thử lại. For the pages' error.tsx.
 */
export function ErrorCard({
  title,
  description = "Kiểm tra kết nối mạng rồi thử lại. Dữ liệu của bạn không bị ảnh hưởng.",
  onRetry,
}: {
  title: string
  description?: string
  onRetry: () => void
}) {
  return (
    <Card size="lg" role="alert">
      <CardContent className="flex flex-col items-center px-6 py-10 text-center">
        <IconTile icon={TriangleAlertIcon} tone="warning" size="lg" />
        <h2 className="mt-4 text-base font-semibold">{title}</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
        <Button className="mt-6" size="lg" onClick={onRetry}>
          <RotateCcwIcon />
          Thử lại
        </Button>
      </CardContent>
    </Card>
  )
}
