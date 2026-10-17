"use client"

import * as React from "react"
import { LightbulbIcon } from "lucide-react"
import { toast } from "sonner"

import { NoticeBanner } from "@/components/app/notice-banner"
import { Button } from "@/components/ui/button"
import { dismissBudgetHintAction, saveBudgetAction } from "@/lib/budgets/actions"
import type { BudgetLine } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"

/**
 * The hint to change a limit (2026-10-17), under a detail screen's lead
 * card, this month only: "Hạn mức có thể quá thấp" (amber) when the last
 * months' average runs well past it, "quá cao" (blue) when under half of it;
 * "Đặt 3tr" sets the average rounded up, "Để sau" hides it for the month.
 */
export function BudgetAdjustHint({
  name,
  groupId,
  line,
}: {
  /** The group's name; null for the whole month's limit. */
  name: string | null
  groupId: string | null
  line: BudgetLine
}) {
  const [pending, startTransition] = React.useTransition()
  const { adjust, budgetId, limit } = line
  if (!adjust || !budgetId || limit === null) return null
  const low = adjust.kind === "low"

  const run = (work: () => Promise<{ success: boolean; error?: string }>, done: string) =>
    startTransition(async () => {
      try {
        const result = await work()
        if (!result.success) return void toast.error(result.error ?? "Không thể lưu. Vui lòng thử lại.")
        toast.success(done)
      } catch {
        toast.error("Không thể lưu. Vui lòng thử lại.")
      }
    })

  return (
    <NoticeBanner
      tone={low ? "warning" : "info"}
      icon={LightbulbIcon}
      title={low ? "Hạn mức có thể quá thấp" : "Hạn mức có thể quá cao"}
      footer={
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() => saveBudgetAction(groupId, adjust.to), `Đã đặt hạn mức ${name ?? "tổng"} ${formatCompactCurrency(adjust.to, 1)}.`)
            }
          >
            Đặt {formatCompactCurrency(adjust.to, 1)}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => dismissBudgetHintAction(budgetId), "Đã ẩn gợi ý tới hết tháng.")}>
            Để sau
          </Button>
        </>
      }
    >
      {`3 tháng gần đây bạn chi trung bình ${formatCompactCurrency(line.average, 1)}${name ? ` cho ${name}` : " mỗi tháng"}, `}
      {low
        ? `hạn mức ${name ? "" : "tổng "}${formatCompactCurrency(limit, 1)} thường bị vượt.`
        : `chưa tới nửa hạn mức ${name ? "" : "tổng "}${formatCompactCurrency(limit, 1)}.`}
    </NoticeBanner>
  )
}
