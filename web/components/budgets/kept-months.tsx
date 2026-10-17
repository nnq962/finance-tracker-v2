"use client"

import { limitJudges, shiftMonthKey } from "@/lib/budgets/months"
import { cn } from "@/lib/utils"

/**
 * The six months before `month`, oldest first: whether each had any
 * transaction yet (`tracked`), and whether the limit, set in `since`, was
 * there to keep (`judged`).
 */
export function monthsBefore(month: string, minMonth: string, since: string | null) {
  return Array.from({ length: 6 }, (_, index) => {
    const key = shiftMonthKey(month, index - 6)
    return { key, tracked: key >= minMonth, judged: key >= minMonth && limitJudges(since, key) }
  })
}

/**
 * How the months before went against the limit, counting only those it was
 * set for (2026-10-17: not the months before it existed): "Tháng trước:
 * trong hạn mức" for one, else "3/4 tháng gần đây trong hạn mức" and a dot
 * for each, oldest first, green kept, red over. Nothing when no month before
 * had the limit.
 */
export function KeptMonths({
  history,
  limit,
  month,
  minMonth,
  since,
  className,
}: {
  /** The six months before, then the month itself (BudgetMonthLine). */
  history: number[]
  limit: number
  month: string
  minMonth: string
  /** "YYYY-MM" the limit was set in. */
  since: string | null
  className?: string
}) {
  const judged = monthsBefore(month, minMonth, since)
    .map((entry, index) => ({ ...entry, spent: history[index] }))
    .filter((entry) => entry.judged)
  if (judged.length === 0) return null
  const kept = judged.filter((entry) => entry.spent <= limit).length
  return (
    <div className={cn("flex items-center justify-between gap-3 text-xs text-muted-foreground", className)}>
      {judged.length === 1 ? (
        <span>
          Tháng trước:{" "}
          <span className={cn("font-medium", kept ? "text-income" : "text-expense")}>{kept ? "trong hạn mức" : "vượt hạn mức"}</span>
        </span>
      ) : (
        <span>
          <span className="font-semibold text-foreground tabular-nums">
            {kept}/{judged.length}
          </span>{" "}
          tháng gần đây trong hạn mức
        </span>
      )}
      {judged.length > 1 ? (
        <span className="flex items-center gap-1" aria-hidden="true">
          {judged.map((entry) => (
            <span key={entry.key} className={cn("size-2 rounded-full", entry.spent <= limit ? "bg-income" : "bg-expense")} />
          ))}
        </span>
      ) : null}
    </div>
  )
}
