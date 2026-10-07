import { SettingsGroup, settingsSeparatorClassName } from "@/components/settings-list"
import { Progress } from "@/components/ui/progress"
import { formatDate, toDateKey } from "@/lib/format-date"
import { cn } from "@/lib/utils"
import type { PlanState } from "@/lib/plans/plans"

/** One allowance counting down: what is left of it, a bar that empties, and a note. */
function UsageMeter({ label, left, total, note }: { label: string; left: number; total: number; note: string }) {
  return (
    // Divided like list rows, inset 16 from both sides.
    <div className={cn("space-y-3 px-4 py-3", settingsSeparatorClassName())}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-base font-medium tabular-nums">
          {left}
          <span className="text-sm font-normal text-muted-foreground">/{total}</span>
        </p>
      </div>
      <Progress value={total > 0 ? (left / total) * 100 : 0} aria-label={`${label}: còn ${left} trên ${total}`} />
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

/**
 * The AI allowances, each counting down as it is used, as usage meters
 * usually do: this month's requests, then the credits from missions, used
 * once the month's run out (shown once any were earned).
 */
export function AiQuotaGroup({ planState }: { planState: PlanState }) {
  const monthLeft = Math.max(0, planState.aiLimit - planState.aiUsed)
  // The first of next month, Vietnam time, when the count starts over.
  const month = Number(toDateKey(new Date()).slice(5, 7))
  const renewsOn = `01/${String((month % 12) + 1).padStart(2, "0")}`

  return (
    <SettingsGroup
      title="Lượt AI"
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
      {null}
    </SettingsGroup>
  )
}
