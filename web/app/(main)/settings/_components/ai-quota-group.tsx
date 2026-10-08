import { SparklesIcon } from "lucide-react"

import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { formatDate, toDateKey } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { plans, type PlanState } from "@/lib/plans/plans"

/** One allowance counting down: what is left of it, a bar that empties, and a note. */
function UsageMeter({ label, left, total, note }: { label: string; left: number; total: number; note: string }) {
  return (
    // Divided like list rows, inset 16 from both sides.
    <div className={cn("space-y-3 px-4 py-3", settingsSeparatorClassName())}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {/* "Còn" says the figure is what is left, so a full bar reads as untouched, not used up. */}
        <p className="text-base font-medium tabular-nums">
          <span className="text-sm font-normal text-muted-foreground">Còn </span>
          {left}
          <span className="text-sm font-normal text-muted-foreground">/{total}</span>
        </p>
      </div>
      <Progress
        tone="ai"
        value={total > 0 ? (left / total) * 100 : 0}
        aria-label={`${label}: còn ${left} trên ${total}`}
      />
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

/**
 * The AI allowances, each counting down as it is used, as usage meters
 * usually do: this month's requests, then the credits from missions, used
 * once the month's run out (shown once any were earned). A row under them
 * opens the plan, as storage screens end with the way to get more.
 */
export function AiQuotaGroup({ planState, onOpenPlan }: { planState: PlanState; onOpenPlan: () => void }) {
  const isPro = planState.plan === "pro"
  const monthLeft = Math.max(0, planState.aiLimit - planState.aiUsed)
  // The first of next month, Vietnam time, when the count starts over.
  const month = Number(toDateKey(new Date()).slice(5, 7))
  const renewsOn = `01/${String((month % 12) + 1).padStart(2, "0")}`

  return (
    <SettingsGroup
      title="Lượt AI"
      // The meters' inset divider above the row too.
      listClassName="relative before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-border"
      header={
        <div>
          <UsageMeter
            label="Lượt tháng này"
            left={monthLeft}
            total={planState.aiLimit}
            note={`Làm mới ${renewsOn}${planState.proEndsAt ? ` · Pro đến ${formatDate(toDateKey(planState.proEndsAt))}` : ""}`}
          />
          {planState.aiCreditsEarned > 0 ? (
            <UsageMeter
              label="Lượt thưởng"
              left={planState.aiCredits}
              total={planState.aiCreditsEarned}
              note="Từ nhiệm vụ, dùng khi hết lượt tháng"
            />
          ) : null}
        </div>
      }
    >
      <SettingsRow
        icon={SparklesIcon}
        tone="ai"
        title={isPro ? "Gói Pro" : "Nâng cấp Pro"}
        description={isPro ? undefined : `${plans.pro.aiMonthlyLimit} lượt mỗi tháng`}
        onClick={onOpenPlan}
      />
    </SettingsGroup>
  )
}
