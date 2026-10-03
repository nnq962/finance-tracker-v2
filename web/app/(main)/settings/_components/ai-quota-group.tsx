import { GiftIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { formatDate, toDateKey } from "@/lib/format-date"
import type { PlanState } from "@/lib/plans/plans"

/** This month's AI requests against the plan's limit, and the credits from missions on top. */
export function AiQuotaGroup({ planState }: { planState: PlanState }) {
  const isPro = planState.plan === "pro"
  const used = Math.min(planState.aiUsed, planState.aiLimit)
  const percent = planState.aiLimit > 0 ? (used / planState.aiLimit) * 100 : 0
  const remaining = Math.max(0, planState.aiLimit - planState.aiUsed)

  return (
    <SettingsGroup
      title="Hạn mức"
      header={
        <div className="space-y-3 px-4 pt-3 pb-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">Lượt trợ lý AI tháng này</p>
            <p className="font-heading text-xl leading-tight font-extrabold tabular-nums">
              {planState.aiUsed}
              <span className="text-base text-muted-foreground">/{planState.aiLimit}</span>
            </p>
          </div>
          <Progress value={percent} tone={percent >= 90 ? "coral" : isPro ? "grape" : "sky"} aria-label="Lượt AI đã dùng" />
          <p className="text-xs text-muted-foreground">
            Còn {remaining} lượt, làm mới vào ngày 1 hằng tháng
            {planState.proEndsAt ? ` · Pro đến ${formatDate(toDateKey(planState.proEndsAt))}` : ""}
          </p>
        </div>
      }
    >
      <SettingsRow
        icon={GiftIcon}
        color="amber"
        title="Lượt thưởng"
        description={
          planState.aiCredits > 0 ? "Dùng khi hết lượt tháng, không hết hạn" : "Làm nhiệm vụ ở Tổng quan để nhận thêm"
        }
        value={String(planState.aiCredits)}
      />
    </SettingsGroup>
  )
}
