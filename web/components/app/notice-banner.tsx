"use client"

import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronRightIcon, InfoIcon, XIcon } from "lucide-react"

import { IconTile, type IconTileTone } from "@/components/app/icon-tile"
import { cn } from "@/lib/utils"

const tones = {
  neutral: { surface: "bg-muted", icon: "text-foreground", text: "", tile: "neutral" },
  info: { surface: "bg-transfer/10 dark:bg-transfer/15", icon: "text-transfer", text: "text-transfer", tile: "transfer" },
  income: { surface: "bg-income/10 dark:bg-income/15", icon: "text-income", text: "text-income", tile: "income" },
  warning: { surface: "bg-warning/15", icon: "text-warning", text: "text-warning", tile: "warning" },
  expense: { surface: "bg-expense/10 dark:bg-expense/15", icon: "text-expense", text: "text-expense", tile: "expense" },
  ai: { surface: "bg-ai/10 dark:bg-ai/15", icon: "text-ai", text: "text-ai", tile: "ai" },
} as const satisfies Record<string, { surface: string; icon: string; text: string; tile: IconTileTone }>

/**
 * A short message in the flow of a page, on a tinted card: news, a warning,
 * a hint. `surface="card"` sets it on a white card like a list row instead,
 * the colour only in its icon tile and title, for an alert that sits among
 * lists (overdue loans) where a tinted block would clash with the page. Closable when onDismiss is given; tapped as a whole, with a
 * chevron, when onClick is (it then opens what it is about); with a small
 * button at the end when action is (a next step, such as recording the
 * payment). For something that needs a decision, use a dialog; for a
 * passing confirmation, a toast.
 */
export function NoticeBanner({
  title,
  children,
  tone = "info",
  surface = "tinted",
  icon: Icon = InfoIcon,
  onDismiss,
  onClick,
  action,
  className,
}: {
  title: React.ReactNode
  children?: React.ReactNode
  tone?: keyof typeof tones
  surface?: "tinted" | "card"
  icon?: LucideIcon
  onDismiss?: () => void
  onClick?: () => void
  /** A small button at the end, e.g. `<Button size="sm" variant="secondary">`. */
  action?: React.ReactNode
  className?: string
}) {
  const onCard = surface === "card"
  const surfaceClassName = onCard ? "bg-card" : tones[tone].surface
  const titleClassName = cn("font-medium", onCard && tones[tone].text)

  if (onClick) {
    return (
      <button
        type="button"
        data-slot="notice-banner"
        onClick={onClick}
        className={cn(
          "pressable flex w-full items-center gap-3 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
          // On a card it has the list row's size and rounding.
          onCard ? "min-h-16 rounded-[20px] px-4 py-3" : "rounded-2xl p-4",
          surfaceClassName,
          className,
        )}
      >
        {onCard ? (
          <IconTile icon={Icon} tone={tones[tone].tile} />
        ) : (
          <Icon aria-hidden="true" className={cn("size-5 shrink-0", tones[tone].icon)} />
        )}
        <span className="min-w-0 flex-1">
          <span className={cn("block", titleClassName)}>{title}</span>
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
      className={cn(
        "flex gap-3 text-sm",
        onCard ? "min-h-16 items-center rounded-[20px] px-4 py-3" : "items-start rounded-2xl p-4",
        surfaceClassName,
        className,
      )}
    >
      {onCard ? (
        <IconTile icon={Icon} tone={tones[tone].tile} />
      ) : (
        <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", tones[tone].icon)} />
      )}
      <div className="min-w-0 flex-1">
        <p className={titleClassName}>{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
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
