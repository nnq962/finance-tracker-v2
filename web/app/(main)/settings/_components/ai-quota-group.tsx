import { GiftIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { formatDate, toDateKey } from "@/lib/format-date"
import type { PlanState } from "@/lib/plans/plans"

/** This month's AI requests against the plan's limit, and the credits from missions on top while any are left. */
export function AiQuotaGroup({ planState }: { planState: PlanState }) {
  const used = Math.min(planState.aiUsed, planState.aiLimit)
  const percent = planState.aiLimit > 0 ? (used / planState.aiLimit) * 100 : 0
  // The first of next month, Vietnam time, when the count starts over.
  const month = Number(toDateKey(new Date()).slice(5, 7))
  const renewsOn = `01/${String((month % 12) + 1).padStart(2, "0")}`
  const hasCredits = planState.aiCredits > 0

  return (
    <SettingsGroup
      title="Hạn mức"
      header={
        // Alone in the card, it keeps equal padding top and bottom.
        <div className={cn("space-y-3 px-4 pt-3", hasCredits ? "pb-2" : "pb-3")}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">Lượt trợ lý AI tháng này</p>
            <p className="font-heading text-xl leading-tight font-extrabold tabular-nums">
              {planState.aiUsed}
              <span className="text-base text-muted-foreground">/{planState.aiLimit}</span>
            </p>
          </div>
          <Progress value={percent} aria-label="Lượt AI đã dùng" />
          <p className="text-xs text-muted-foreground">
            Làm mới {renewsOn}
            {planState.proEndsAt ? ` · Pro đến ${formatDate(toDateKey(planState.proEndsAt))}` : ""}
          </p>
        </div>
      }
    >
      {hasCredits ? (
        <SettingsRow
          icon={GiftIcon}
          color="amber"
          title="Lượt thưởng"
          description="Dùng khi hết lượt tháng"
          value={String(planState.aiCredits)}
        />
      ) : null}
    </SettingsGroup>
  )
}
