import { SparklesIcon } from "lucide-react"

import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { formatDate, toDateKey } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import { plans, type PlanState } from "@/lib/plans/plans"

/** One allowance counting down: what is left of it, a bar that empties, and a note. */
function UsageMeter({
  label,
  left,
  total,
  note,
  secondary = false,
}: {
  label: string
  left: number
  total: number
  note: string
  /** The lesser of two meters (the bonus credits): its bar softer, so the month's leads. */
  secondary?: boolean
}) {
  // A fifth or less left turns the bar amber; none left says so in red under it (2026-10-21:
  // an empty bar read the same as an untouched one).
  const share = total > 0 ? left / total : 0
  const low = total > 0 && left > 0 && share <= 0.2
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
        value={share * 100}
        tone={low ? "warning" : secondary ? "soft" : "default"}
        aria-label={`${label}: còn ${left} trên ${total}`}
      />
      <p className="text-xs text-muted-foreground">
        {total > 0 && left === 0 ? <span className="font-medium text-destructive-text">Đã hết · </span> : null}
        {note}
      </p>
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
      listClassName="relative before:absolute before:inset-x-4 before:top-0 before:h-px before:bg-separator"
      header={
        <div>
          <UsageMeter
            label="Lượt tháng này"
            left={monthLeft}
            total={planState.aiLimit}
            note={`${monthLeft === 0 && planState.aiCredits > 0 ? "Đang dùng lượt thưởng · " : ""}Làm mới ${renewsOn}${planState.proEndsAt ? ` · Pro đến ${formatDate(toDateKey(planState.proEndsAt))}` : ""}`}
          />
          {planState.aiCreditsEarned > 0 ? (
            <UsageMeter
              label="Lượt thưởng"
              left={planState.aiCredits}
              total={planState.aiCreditsEarned}
              note="Từ nhiệm vụ, dùng khi hết lượt tháng"
              secondary
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
