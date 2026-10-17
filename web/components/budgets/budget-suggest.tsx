"use client"

import * as React from "react"
import { GaugeIcon, SaveIcon, SparklesIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { IconTile } from "@/components/app/icon-tile"
import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsFieldRow, SettingsGroup } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { saveBudgetsAction } from "@/lib/budgets/actions"
import { suggestedLimit } from "@/lib/budgets/calculations"
import type { BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

/** Whether there is anything to suggest from: spending in the last three months. */
export function canSuggest(overview: BudgetOverview) {
  return overview.total.average > 0
}

/**
 * The first limits, before any is set (2026-10-17): the suggestion in brief
 * (the whole month's and the three largest groups', from the last three
 * months), "Tự đặt" and "Đặt theo gợi ý"; for a user without three months
 * of spending, one button to set one by hand. ✕ puts it away on this device
 * (limits are still set from Cài đặt).
 */
export function BudgetInvite({
  overview,
  onSuggest,
  onOwn,
  onDismiss,
}: {
  overview: BudgetOverview
  onSuggest: () => void
  onOwn: () => void
  onDismiss: () => void
}) {
  const suggesting = canSuggest(overview)
  const spending = overview.groups.filter((group) => group.average > 0).sort((a, b) => b.average - a.average)
  const top = spending.slice(0, 3)
  const more = spending.length - top.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <IconTile icon={GaugeIcon} tone="card" size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-base font-semibold">Đặt mức chi tối đa mỗi tháng</p>
          <p className="text-sm text-muted-foreground">
            {suggesting
              ? "Gợi ý theo mức chi trung bình 3 tháng gần nhất. Timi báo khi gần chạm và khi vượt."
              : "Đặt một hạn mức tổng, hoặc cho từng nhóm. Timi báo khi gần chạm và khi vượt."}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" className="-mt-1 -mr-2" aria-label="Để sau" onClick={onDismiss}>
          <XIcon />
        </Button>
      </div>

      {suggesting ? (
        <ul className="flex flex-col rounded-2xl bg-muted px-3.5 py-1">
          <li className="flex min-h-10 items-center gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">Hạn mức tổng</span>
            <span className="font-semibold tabular-nums">{formatCompactCurrency(suggestedLimit(overview.total.average)!, 1)}</span>
          </li>
          {top.map((group) => (
            <li key={group.groupId} className="flex min-h-10 items-center gap-3 border-t border-separator text-sm">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{group.name}</span>
              <span className="tabular-nums">{formatCompactCurrency(suggestedLimit(group.average)!, 1)}</span>
            </li>
          ))}
          {more > 0 ? (
            <li className="flex min-h-10 items-center border-t border-separator text-sm text-muted-foreground">và {more} nhóm khác</li>
          ) : null}
        </ul>
      ) : null}

      <div className="flex gap-2">
        {suggesting ? (
          <>
            <Button variant="secondary" className="flex-1" onClick={onOwn}>
              Tự đặt
            </Button>
            <Button className="flex-1" onClick={onSuggest}>
              <SparklesIcon /> Đặt theo gợi ý
            </Button>
          </>
        ) : (
          <Button className="flex-1" onClick={onOwn}>
            Đặt hạn mức
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * The suggestion to review before saving: the whole month's and every
 * spending group's amount, each its three-month average rounded up
 * (suggestedLimit), changed in place or emptied to leave it out; "Lưu N hạn
 * mức" sets them all at once.
 */
export function BudgetSuggestSheet({
  overview,
  open,
  onOpenChange,
}: {
  overview: BudgetOverview
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <PageSheet title="Đặt theo gợi ý" open={open} onOpenChange={onOpenChange}>
      {/* A fresh suggestion each time it opens. */}
      {open ? <SuggestForm overview={overview} onDone={() => onOpenChange(false)} /> : null}
    </PageSheet>
  )
}

function SuggestForm({ overview, onDone }: { overview: BudgetOverview; onDone: () => void }) {
  const [amounts, setAmounts] = React.useState<Record<string, number | null>>(() =>
    Object.fromEntries([
      ["total", suggestedLimit(overview.total.average)],
      ...overview.groups.map((group) => [group.groupId, suggestedLimit(group.average)]),
    ]),
  )
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const entries = Object.entries(amounts).flatMap(([key, amount]) =>
    amount ? [{ groupId: key === "total" ? null : key, amount }] : [],
  )
  const set = (key: string) => (value: number | null) => {
    setAmounts((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (entries.length === 0) return
    startTransition(async () => {
      try {
        const result = await saveBudgetsAction(entries)
        if (!result.success) return setError(result.error)
        toast.success(`Đã đặt ${entries.length} hạn mức.`)
        onDone()
      } catch {
        setError("Không thể lưu hạn mức. Vui lòng thử lại.")
      }
    })
  }

  return (
    <form className="flex flex-1 flex-col gap-6" onSubmit={submit} noValidate>
      <p className="px-1 text-sm text-muted-foreground">
        Mỗi số là mức chi trung bình 3 tháng gần nhất, làm tròn lên. Sửa số nào cũng được; xoá trống thì không đặt.
      </p>
      <SettingsGroup>
        <SettingsFieldRow
          htmlFor="suggest-total"
          icon={GaugeIcon}
          title="Hạn mức tổng"
          description={overview.total.average ? `Trung bình ${formatCompactCurrency(overview.total.average, 1)}` : "Chưa có khoản chi"}
        >
          <CurrencyInput variant="inline" id="suggest-total" name="total" placeholder="Không đặt" value={amounts.total} onValueChange={set("total")} />
        </SettingsFieldRow>
      </SettingsGroup>
      {overview.groups.length > 0 ? (
        <SettingsGroup title="Theo nhóm">
          {overview.groups.map((group) => (
            <SettingsFieldRow
              key={group.groupId}
              htmlFor={`suggest-${group.groupId}`}
              icon={categoryIconRegistry[group.iconName]}
              tone={group.colorName}
              title={group.name}
              description={group.average ? `Trung bình ${formatCompactCurrency(group.average, 1)}` : "Chưa có khoản chi"}
            >
              <CurrencyInput
                variant="inline"
                id={`suggest-${group.groupId}`}
                name={group.groupId}
                placeholder="Không đặt"
                value={amounts[group.groupId]}
                onValueChange={set(group.groupId)}
              />
            </SettingsFieldRow>
          ))}
        </SettingsGroup>
      ) : null}
      {error ? <FieldError className="px-4">{error}</FieldError> : null}
      <PageSheetFooter>
        <Button type="submit" disabled={pending || entries.length === 0}>
          {pending ? <Spinner /> : <SaveIcon />}
          {pending ? "Đang lưu…" : entries.length ? `Lưu ${entries.length} hạn mức` : "Chưa chọn hạn mức nào"}
        </Button>
      </PageSheetFooter>
    </form>
  )
}
