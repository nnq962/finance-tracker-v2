import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * How much a figure changed against an earlier one, as a small tinted pill:
 * an arrow for the direction and the change in percent. Green when the
 * change is good (`goodWhen`: spending going down, income going up), red
 * when it is bad, grey when flat. Nothing to compare against shows nothing.
 */
export function DeltaBadge({
  current,
  previous,
  goodWhen,
  comparedTo,
  className,
}: {
  current: number
  previous: number
  goodWhen: "up" | "down"
  /** What the change is measured against, for screen readers and the tooltip, e.g. "cùng kỳ tháng 9". */
  comparedTo: string
  className?: string
}) {
  if (previous <= 0) return null

  const percent = Math.round(((current - previous) / previous) * 100)
  const direction = percent > 0 ? "up" : percent < 0 ? "down" : "flat"
  const Icon = direction === "down" ? ArrowDownRightIcon : ArrowUpRightIcon
  const label = `${direction === "down" ? "Giảm" : direction === "up" ? "Tăng" : "Không đổi"} ${Math.abs(percent)}% so với ${comparedTo}`

  return (
    <span
      data-slot="delta-badge"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        direction === "flat"
          ? "bg-muted text-muted-foreground"
          : direction === goodWhen
            ? "bg-income/10 text-income dark:bg-income/15"
            : "bg-expense/10 text-expense dark:bg-expense/15",
        className,
      )}
    >
      {direction === "flat" ? null : <Icon aria-hidden="true" className="size-3" />}
      {Math.abs(percent) > 999 ? ">999" : Math.abs(percent)}%
    </span>
  )
}
