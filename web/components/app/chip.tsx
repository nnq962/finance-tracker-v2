"use client"

import type * as React from "react"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A static chip for something chosen or attached: a person, a tag. It can
 * lead with an avatar (`media`) and carry an × to remove it. Chips that are
 * toggled on and off (filters) are ToggleGroup items instead.
 */
export function Chip({
  children,
  media,
  onRemove,
  removeLabel = "Xoá",
  className,
}: {
  children: React.ReactNode
  media?: React.ReactNode
  onRemove?: () => void
  removeLabel?: string
  className?: string
}) {
  return (
    <span
      data-slot="chip"
      className={cn(
        "inline-flex h-9 max-w-full items-center gap-2 rounded-full bg-field px-3.5 text-sm",
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
          className="relative grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground after:absolute after:-inset-2 active:bg-foreground/10"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </span>
  )
}
