import type * as React from "react"
import { ArchiveIcon, ChevronRightIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The way into what is put away (2026-10-21, direction C of four on the
 * accounts page, then the settled debts): one quiet line under the groups in
 * use, no card, as Reminders' "Show Completed", instead of a group folded
 * into the page with a small Hiện / Thu gọn. It opens a sheet listing them.
 * 44 tall, grey text with an icon and a chevron; centred on phones, at the
 * start from lg (`align`).
 */
export function ShelfLink({
  icon: Icon = ArchiveIcon,
  align = "responsive",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "type"> & {
  icon?: LucideIcon
  /** `responsive`: centred below lg, at the start from lg; `center`: always centred; `fill`: a full-width row, the chevron at its end (2026-10-23). */
  align?: "responsive" | "center" | "fill"
}) {
  return (
    <button
      type="button"
      data-slot="shelf-link"
      className={cn(
        "pressable mx-auto flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/30 active:bg-muted [@media(hover:hover)]:hover:bg-muted",
        align === "responsive" && "lg:mx-0",
        align === "fill" && "mx-0 min-h-12 w-full gap-2.5 rounded-[16px] px-[18px] text-left text-[13px] font-semibold",
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn("size-4 shrink-0", align === "fill" && "size-[17px]")} />
      {align === "fill" ? <span className="min-w-0 flex-1 truncate">{children}</span> : children}
      <ChevronRightIcon aria-hidden="true" className={cn("size-4 shrink-0", align === "fill" && "opacity-60")} />
    </button>
  )
}
