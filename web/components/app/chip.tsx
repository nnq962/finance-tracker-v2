"use client"

import type * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A static chip for something chosen or attached: a person, a tag. It can
 * lead with an avatar (`media`) and carry an × to remove it. `tone="income"`
 * for something that saves money, e.g. a coupon taken. Chips that are
 * toggled on and off (filters) are ToggleGroup items instead.
 */
export function Chip({
  children,
  media,
  onRemove,
  removeLabel = "Xoá",
  tone = "default",
  className,
}: {
  children: React.ReactNode
  media?: React.ReactNode
  onRemove?: () => void
  removeLabel?: string
  tone?: "default" | "income"
  className?: string
}) {
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex h-9 max-w-full items-center gap-2 rounded-full px-3.5 text-sm",
        tone === "income" ? "bg-income/10 font-medium text-income dark:bg-income/15" : "bg-field",
        media && "pl-1",
        onRemove && "gap-1 pr-1.5",
        className,
      )}
    >
      {media}
      <span className="truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`${removeLabel} ${typeof children === "string" ? children : ""}`.trim()}
          onClick={onRemove}
          className={cn(
            "relative grid size-6 shrink-0 place-items-center rounded-full after:absolute after:-inset-2 active:bg-foreground/10",
            tone === "income" ? "text-income" : "text-muted-foreground",
          )}
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </span>
  )
}
