"use client"

import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronRightIcon, InfoIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const tones = {
  neutral: { surface: "bg-muted", icon: "text-foreground" },
  info: { surface: "bg-transfer/10 dark:bg-transfer/15", icon: "text-transfer" },
  income: { surface: "bg-income/10 dark:bg-income/15", icon: "text-income" },
  warning: { surface: "bg-warning/15", icon: "text-warning" },
  expense: { surface: "bg-expense/10 dark:bg-expense/15", icon: "text-expense" },
  ai: { surface: "bg-ai/10 dark:bg-ai/15", icon: "text-ai" },
} as const

/**
 * A short message in the flow of a page, on a tinted card: news, a warning,
 * a hint. Closable when onDismiss is given; tapped as a whole, with a
 * chevron, when onClick is (it then opens what it is about). For something
 * that needs a decision, use a dialog; for a passing confirmation, a toast.
 */
export function NoticeBanner({
  title,
  children,
  tone = "info",
  icon: Icon = InfoIcon,
  onDismiss,
  onClick,
  className,
}: {
  title: React.ReactNode
  children?: React.ReactNode
  tone?: keyof typeof tones
  icon?: LucideIcon
  onDismiss?: () => void
  onClick?: () => void
  className?: string
}) {
  if (onClick) {
    return (
      <button
        type="button"
        data-slot="notice-banner"
        onClick={onClick}
        className={cn(
          "pressable flex w-full items-center gap-3 rounded-2xl p-4 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
          tones[tone].surface,
          className,
        )}
      >
        <Icon aria-hidden="true" className={cn("size-5 shrink-0", tones[tone].icon)} />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{title}</span>
          {children ? <span className="block truncate text-muted-foreground">{children}</span> : null}
        </span>
        <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div
      role="status"
      data-slot="notice-banner"
      className={cn("flex items-start gap-3 rounded-2xl p-4 text-sm", tones[tone].surface, className)}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", tones[tone].icon)} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          aria-label="Đóng"
          onClick={onDismiss}
          className="relative -m-1 grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground after:absolute after:-inset-2 active:bg-foreground/5"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
