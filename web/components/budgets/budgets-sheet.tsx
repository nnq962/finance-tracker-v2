"use client"

import * as React from "react"
import { GaugeIcon, PlusIcon, SaveIcon, Trash2Icon, ZapIcon } from "lucide-react"
import { toast } from "sonner"

import { IconTile } from "@/components/app/icon-tile"
import { LimitRow } from "@/components/app/limit-row"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { deleteBudgetAction, saveBudgetAction } from "@/lib/budgets/actions"
import {
  budgetPace,
  budgetPercent,
  daysLeft,
  groupsByUse,
  hasAnyBudget,
  hasLimit,
  limitTone,
  monthShare,
  remainingLabel,
  suggestedLimit,
} from "@/lib/budgets/calculations"
import type { BudgetGroupLine, BudgetLine, BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"

import { BudgetTotal } from "./budget-total"

/** The limit being set: the whole month's, or a group's. */
type Target = { kind: "total" } | { kind: "group"; groupId: string }

function GroupTile({ group, size = "sm" }: { group: BudgetGroupLine; size?: "sm" | "lg" }) {
  return <IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size={size} />
}

/**
 * Every limit of the month (2026-10-16), opened from the overview's card, the
 * line under the transactions' figures and Cài đặt: the whole month's at the
 * top (a tap changes it), a warning while spending runs ahead of the month,
 * then each group's with its bar, then the groups without one, each with its
 * three-month average, a tap to set one. With none at all, a word and a
 * button to set the month's.
 */
export function BudgetsSheet({
  overview,
  open,
  onOpenChange,
}: {
  overview: BudgetOverview
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [editing, setEditing] = React.useState<Target | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const edit = (target: Target) => {
    setEditing(target)
    setEditOpen(true)
  }

  const { total } = overview
  const limited = groupsByUse(overview)
  const unlimited = overview.groups.filter((group) => !hasLimit(group))
  const days = daysLeft(overview)
  const share = monthShare(overview)
  const fast = hasLimit(total) && total.spent <= total.limit && budgetPace(total.spent, total.limit, share) === "fast"

  return (
    <>
    <PageSheet title={`Hạn mức tháng ${Number(overview.month.slice(5))}`} open={open} onOpenChange={onOpenChange} className="gap-6">
      {!hasAnyBudget(overview) ? (
        <div className="flex flex-col items-center gap-2 px-6 pt-6 text-center">
          <IconTile icon={GaugeIcon} tone="card" size="lg" />
          <p className="mt-2 text-base font-semibold">Chưa có hạn mức</p>
          <p className="text-sm text-muted-foreground">Đặt mức chi tối đa mỗi tháng, cho cả tháng hoặc từng nhóm hạng mục.</p>
          <Button className="mt-3" onClick={() => edit({ kind: "total" })}>
            <PlusIcon /> Đặt hạn mức tháng
          </Button>
        </div>
      ) : (
        <>
          {hasLimit(total) ? (
            <Card size="lg" asChild>
              <button type="button" className="w-full text-left transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100" onClick={() => edit({ kind: "total" })}>
                <CardContent>
                  <BudgetTotal overview={overview} />
                </CardContent>
              </button>
            </Card>
          ) : (
            <SettingsGroup>
              <SettingsRow
                media={<IconTile icon={GaugeIcon} tone="neutral" size="sm" />}
                title="Hạn mức cả tháng"
                description={`Đã chi ${formatCompactCurrency(total.spent, 1)} tháng này`}
                action={<PlusIcon className="size-5 text-muted-foreground" aria-hidden="true" />}
                chevron={false}
                onClick={() => edit({ kind: "total" })}
              />
            </SettingsGroup>
          )}

          {fast ? (
            <NoticeBanner tone="warning" icon={ZapIcon} title="Đang chi nhanh hơn kế hoạch">
              Đã dùng {budgetPercent(total.spent, total.limit!)}% hạn mức khi tháng mới qua {Math.round(share * 100)}%.
            </NoticeBanner>
          ) : null}

          {limited.length > 0 ? (
            <SettingsGroup title={`Theo nhóm · ${limited.length}`}>
              {limited.map((group) => (
                <LimitRow
                  key={group.groupId}
                  media={<GroupTile group={group} />}
                  title={group.name}
                  figure={
                    <>
                      <span className="font-semibold">{formatCompactCurrency(group.spent, 1)}</span>
                      <span className="text-muted-foreground"> / {formatCompactCurrency(group.limit, 1)}</span>
                    </>
                  }
                  value={group.spent}
                  max={group.limit}
                  tone={limitTone(group.spent, group.limit)}
                  caption={remainingLabel(group.spent, group.limit, days)}
                  onClick={() => edit({ kind: "group", groupId: group.groupId })}
                />
              ))}
            </SettingsGroup>
          ) : null}

          {unlimited.length > 0 ? (
            <SettingsGroup title="Chưa đặt hạn mức" footer="Gợi ý là mức chi trung bình 3 tháng gần nhất.">
              {unlimited.map((group) => (
                <SettingsRow
                  key={group.groupId}
                  media={<GroupTile group={group} />}
                  title={group.name}
                  description={group.average ? `Trung bình ${formatCompactCurrency(group.average, 1)}/tháng` : "Chưa có khoản chi"}
                  action={<PlusIcon className="size-5 text-muted-foreground" aria-hidden="true" />}
                  chevron={false}
                  onClick={() => edit({ kind: "group", groupId: group.groupId })}
                />
              ))}
            </SettingsGroup>
          ) : null}
        </>
      )}
    </PageSheet>
    {/* Beside the list's sheet, not in it, so its gestures stay its own. */}
    {editing ? <BudgetFormSheet overview={overview} target={editing} open={editOpen} onOpenChange={setEditOpen} /> : null}
    </>
  )
}

/**
 * A limit set or changed: the group's tile and name (or the month's), the
 * amount large, starting from the three-month average rounded up when there
 * is none yet, that average and this month's spending under it; Delete
 * (with undo) beside Save when it exists.
 */
function BudgetFormSheet({
  overview,
  target,
  open,
  onOpenChange,
}: {
  overview: BudgetOverview
  target: Target
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const group = target.kind === "group" ? overview.groups.find((line) => line.groupId === target.groupId) : undefined
  const line: BudgetLine | undefined = target.kind === "total" ? overview.total : group
  return (
    <PageSheet title={line?.budgetId ? "Sửa hạn mức" : "Đặt hạn mức"} open={open} onOpenChange={onOpenChange}>
      {/* A fresh form each time it opens. */}
      {open && line ? <BudgetForm group={group} line={line} onDone={() => onOpenChange(false)} /> : null}
    </PageSheet>
  )
}

function BudgetForm({ group, line, onDone }: { group?: BudgetGroupLine; line: BudgetLine; onDone: () => void }) {
  const suggested = suggestedLimit(line.average)
  const [amount, setAmount] = React.useState<number | null>(line.limit ?? suggested)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const name = group?.name ?? "Cả tháng"

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!amount) {
      setError("Nhập hạn mức.")
      document.getElementById("budget-amount")?.focus()
      return
    }
    startTransition(async () => {
      try {
        const result = await saveBudgetAction(group?.groupId ?? null, amount)
        if (!result.success) return setError(result.error)
        toast.success("Đã lưu hạn mức.")
        onDone()
      } catch {
        setError("Không thể lưu hạn mức. Vui lòng thử lại.")
      }
    })
  }

  const remove = () => {
    const { budgetId, limit } = line
    if (!budgetId || limit === null) return
    onDone()
    scheduleUndoableDelete({
      key: `budget:${budgetId}`,
      title: `Đã xoá hạn mức “${name}”`,
      pendingMessage: "Đang xoá hạn mức…",
      undoMessage: "Đã giữ lại hạn mức.",
      errorMessage: "Không thể xoá hạn mức. Vui lòng thử lại.",
      onCommit: async () => {
        const result = await deleteBudgetAction(budgetId)
        if (!result.success) throw new Error(result.error)
      },
    })
  }

  return (
    <form className="flex flex-1 flex-col gap-6" onSubmit={submit} noValidate>
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        {group ? <GroupTile group={group} size="lg" /> : <IconTile icon={GaugeIcon} tone="card" size="lg" />}
        <p className="text-base font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">Mỗi tháng, tự lặp lại</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <CurrencyInput
          variant="hero"
          id="budget-amount"
          name="amount"
          value={amount}
          onValueChange={(value) => {
            setAmount(value)
            setError(null)
          }}
          history={suggested ? [suggested] : []}
          invalid={Boolean(error)}
          required
        />
        {error ? <FieldError className="text-center">{error}</FieldError> : null}
      </div>

      <SettingsGroup>
        <SettingsRow title="Trung bình 3 tháng" value={line.average ? formatCurrency(line.average) : "Chưa có"} />
        <SettingsRow title="Đã chi tháng này" value={formatCurrency(line.spent)} />
      </SettingsGroup>

      <PageSheetFooter>
        <div className="flex items-center gap-2">
          {line.budgetId ? (
            <Button type="button" variant="destructive" className="w-30 px-0" disabled={pending} onClick={remove}>
              <Trash2Icon /> Xoá
            </Button>
          ) : null}
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? <Spinner /> : <SaveIcon />}
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </PageSheetFooter>
    </form>
  )
}
