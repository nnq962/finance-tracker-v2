"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, GaugeIcon, PencilIcon, PlusIcon, SaveIcon, SparklesIcon, Trash2Icon, ZapIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { IconTile } from "@/components/app/icon-tile"
import { LimitRow } from "@/components/app/limit-row"
import { Money } from "@/components/app/money"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { deleteBudgetAction, loadBudgetMonthAction, saveBudgetAction } from "@/lib/budgets/actions"
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
import { limitJudges, shiftMonthKey } from "@/lib/budgets/months"
import type { BudgetGroupLine, BudgetLine, BudgetMonth, BudgetMonthLine, BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"

import { KeptMonths } from "./budget-charts"
import { BudgetDetailSkeleton, BudgetGroupDetail, BudgetTotalDetail, JarsNote } from "./budget-detail"
import { BudgetSuggestSheet, canSuggest } from "./budget-suggest"
import { BudgetResult, BudgetTotal } from "./budget-total"

/** The limit being set: the whole month's, or a group's. */
export type BudgetTarget = { kind: "total" } | { kind: "group"; groupId: string }
type Target = BudgetTarget

function GroupTile({ group, size = "sm" }: { group: BudgetGroupLine; size?: "sm" | "lg" }) {
  return <IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size={size} />
}

/** A detail screen: the whole month's limit, or a group's. */
type Screen = { type: "total" } | { type: "group"; groupId: string } | null

/**
 * Every limit (2026-10-16), opened from the overview's card, the line under
 * the transactions' figures and Cài đặt. With none at all, a word and a
 * button to set the month's; otherwise BudgetsSheetBody. Changing a limit
 * opens its form beside this sheet.
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
  const edit = React.useCallback((target: Target) => {
    setEditing(target)
    setEditOpen(true)
  }, [])
  const [suggestOpen, setSuggestOpen] = React.useState(false)

  return (
    <>
      <PageSheet title="Hạn mức" open={open} onOpenChange={onOpenChange} className="gap-6">
        {!hasAnyBudget(overview) ? (
          <div className="flex flex-col items-center gap-2 px-6 pt-6 text-center">
            <IconTile icon={GaugeIcon} tone="card" size="lg" />
            <p className="mt-2 text-base font-semibold">Chưa có hạn mức</p>
            <p className="text-sm text-muted-foreground">Đặt mức chi tối đa mỗi tháng: một hạn mức tổng, hoặc cho từng nhóm hạng mục.</p>
            {canSuggest(overview) ? (
              <div className="mt-3 flex w-full max-w-80 gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => edit({ kind: "total" })}>
                  Tự đặt
                </Button>
                <Button className="flex-1" onClick={() => setSuggestOpen(true)}>
                  <SparklesIcon /> Đặt theo gợi ý
                </Button>
              </div>
            ) : (
              <Button className="mt-3" onClick={() => edit({ kind: "total" })}>
                <PlusIcon /> Đặt hạn mức tổng
              </Button>
            )}
          </div>
        ) : (
          <BudgetsSheetBody overview={overview} onEdit={edit} onClose={() => onOpenChange(false)} />
        )}
      </PageSheet>
      {/* Beside the list's sheet, not in it, so its gestures stay its own. */}
      {editing ? <BudgetFormSheet overview={overview} target={editing} open={editOpen} onOpenChange={setEditOpen} /> : null}
      <BudgetSuggestSheet overview={overview} open={suggestOpen} onOpenChange={setSuggestOpen} />
    </>
  )
}

/**
 * The limits of a month (2026-10-17), this one to start with, ‹ › for the
 * months before (as far back as the first transaction): the whole month's
 * card (a tap opens its detail), a warning while spending runs ahead, each
 * group's row (a tap opens its detail), and this month the groups without a
 * limit, each with its average and a tap to set one. A month gone by shows
 * how each ended, kept or over. The details are screens of this sheet,
 * loaded per month (BudgetMonth); this month's list shows at once from
 * `overview`. Past months are measured against today's limits.
 */
function BudgetsSheetBody({
  overview,
  onEdit,
  onClose,
}: {
  overview: BudgetOverview
  onEdit: (target: Target) => void
  onClose: () => void
}) {
  const router = useRouter()
  const thisMonth = overview.month
  const today = `${thisMonth}-${String(overview.day).padStart(2, "0")}`
  const [month, setMonth] = React.useState(thisMonth)
  const [screen, setScreen] = React.useState<Screen>(null)
  const [months, setMonths] = React.useState<Record<string, BudgetMonth>>({})
  // Loaded again once a limit or what is spent changes (saved here or elsewhere).
  const version = [overview.total.limit, overview.total.spent, ...overview.groups.map((group) => `${group.limit}:${group.spent}`)].join()
  const key = `${month}|${version}`
  const data = months[key]

  React.useEffect(() => {
    if (data) return
    let live = true
    void loadBudgetMonthAction(month).then((result) => {
      if (live && result) setMonths((loaded) => ({ ...loaded, [key]: result }))
    })
    return () => {
      live = false
    }
  }, [data, key, month])

  const past = month < thisMonth
  const number = Number(month.slice(5))
  const detailGroup = screen?.type === "group" ? data?.groups.find((group) => group.groupId === screen.groupId) : undefined
  const groupName = screen?.type === "group" ? (overview.groups.find((group) => group.groupId === screen.groupId)?.name ?? "Nhóm") : ""

  usePageSheetScreen(
    screen
      ? {
          title: screen.type === "total" ? (past ? `Hạn mức tổng · tháng ${number}` : "Hạn mức tổng") : past ? `${groupName} · tháng ${number}` : groupName,
          onBack: () => setScreen(null),
          // A month gone by is only looked at; limits are changed from this one.
          action: past ? undefined : (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Sửa hạn mức"
              onClick={() => onEdit(screen.type === "total" ? { kind: "total" } : { kind: "group", groupId: screen.groupId })}
            >
              <PencilIcon />
            </Button>
          ),
        }
      : null,
  )

  const showTransactions = (groupIds: string[]) => {
    onClose()
    const params = new URLSearchParams()
    if (month !== thisMonth) params.set("month", month)
    if (groupIds.length) params.set("group", groupIds.join(","))
    router.push(`/transactions${params.size ? `?${params}` : ""}`)
  }

  if (screen) {
    if (!data) return <BudgetDetailSkeleton />
    if (screen.type === "total" && hasLimit(data.total)) {
      return (
        <BudgetTotalDetail
          month={data}
          onGroup={(groupId) => {
            if (data.groups.some((group) => group.groupId === groupId && group.limit !== null)) setScreen({ type: "group", groupId })
          }}
          onShowTransactions={showTransactions}
        />
      )
    }
    if (detailGroup && hasLimit(detailGroup)) {
      return <BudgetGroupDetail month={data} group={detailGroup} today={today} onShowTransactions={showTransactions} />
    }
  }

  const changeMonth = (by: number) => {
    setScreen(null)
    setMonth((current) => shiftMonthKey(current, by))
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 pl-1">
        <h2 className="text-base font-semibold">
          Tháng {number}
          {month.slice(0, 4) !== thisMonth.slice(0, 4) ? `, ${month.slice(0, 4)}` : ""}
        </h2>
        <span className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Tháng trước"
            disabled={!data || month <= data.minMonth}
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button type="button" variant="secondary" size="icon" aria-label="Tháng sau" disabled={!past} onClick={() => changeMonth(1)}>
            <ChevronRightIcon />
          </Button>
        </span>
      </div>
      {past ? (
        <PastMonthList data={data} onOpen={setScreen} onShowTransactions={showTransactions} />
      ) : (
        <ThisMonthList overview={overview} data={data} onOpen={setScreen} onEdit={onEdit} />
      )}
    </>
  )
}

/** The six months before, under a month's lead figure; a line of its height while they load. */
function KeptLine({ data, line }: { data?: BudgetMonth; line?: BudgetMonthLine }) {
  if (!data || !line) return <Skeleton className="mt-4 h-4 w-full" />
  if (!hasLimit(line)) return null
  return (
    <KeptMonths
      history={line.history}
      limit={line.limit}
      month={data.month}
      minMonth={data.minMonth}
      since={line.since}
      className="mt-4 border-t border-separator pt-3.5 empty:hidden"
    />
  )
}

function ThisMonthList({
  overview,
  data,
  onOpen,
  onEdit,
}: {
  overview: BudgetOverview
  data?: BudgetMonth
  onOpen: (screen: Screen) => void
  onEdit: (target: Target) => void
}) {
  const { total } = overview
  const limited = groupsByUse(overview)
  const unlimited = overview.groups.filter((group) => !hasLimit(group))
  const days = daysLeft(overview)
  const share = monthShare(overview)
  const fast = hasLimit(total) && total.spent <= total.limit && budgetPace(total.spent, total.limit, share) === "fast"

  return (
    <>
      {hasLimit(total) ? (
        <Card size="lg" asChild>
          <button
            type="button"
            className="w-full text-left transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            onClick={() => onOpen({ type: "total" })}
          >
            <CardContent>
              <BudgetTotal overview={overview} />
              <JarsNote amount={total.fromJars} className="mt-1.5" />
              <KeptLine data={data} line={data?.total} />
            </CardContent>
          </button>
        </Card>
      ) : (
        <SettingsGroup>
          <SettingsRow
            media={<IconTile icon={GaugeIcon} tone="neutral" size="sm" />}
            title="Hạn mức tổng"
            description={`Đã chi ${formatCompactCurrency(total.spent, 1)} tháng này`}
            action={<PlusIcon className="size-5 text-muted-foreground" aria-hidden="true" />}
            chevron={false}
            onClick={() => onEdit({ kind: "total" })}
          />
        </SettingsGroup>
      )}

      {fast ? (
        <NoticeBanner tone="warning" icon={ZapIcon} title="Đang chi nhanh">
          Đã dùng {budgetPercent(total.spent, total.limit!)}% hạn mức khi tháng mới qua {overview.day} ngày.
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
              // The same colour as everywhere else: amber from 80% or while running fast for the time gone.
              tone={limitTone(group.spent, group.limit, share)}
              caption={remainingLabel(group.spent, group.limit, days)}
              onClick={() => onOpen({ type: "group", groupId: group.groupId })}
            />
          ))}
        </SettingsGroup>
      ) : null}

      {unlimited.length > 0 ? (
        <SettingsGroup title="Chưa đặt hạn mức" footer="Khi đặt, số gợi ý là mức chi trung bình 3 tháng gần nhất.">
          {unlimited.map((group) => (
            <SettingsRow
              key={group.groupId}
              media={<GroupTile group={group} />}
              title={group.name}
              description={group.average ? `Trung bình ${formatCompactCurrency(group.average, 1)}/tháng` : "Chưa có khoản chi"}
              action={<PlusIcon className="size-5 text-muted-foreground" aria-hidden="true" />}
              chevron={false}
              onClick={() => onEdit({ kind: "group", groupId: group.groupId })}
            />
          ))}
        </SettingsGroup>
      ) : null}
    </>
  )
}

/**
 * A month gone by: how the whole month and each group with a limit ended;
 * then every other group with what it spent, so the parts add up to the
 * whole. A limit set after that month did not judge it: its group is listed
 * with the others, and the whole month's card only says what was spent.
 */
function PastMonthList({
  data,
  onOpen,
  onShowTransactions,
}: {
  data?: BudgetMonth
  onOpen: (screen: Screen) => void
  onShowTransactions: (groupIds: string[]) => void
}) {
  if (!data) return <BudgetDetailSkeleton />
  const number = Number(data.month.slice(5))
  const judged = (line: BudgetMonthLine) => hasLimit(line) && limitJudges(line.since, data.month)
  const limited = data.groups.filter(judged).sort((a, b) => b.spent / b.limit! - a.spent / a.limit!)
  const others = data.groups.filter((group) => !judged(group) && group.spent > 0).sort((a, b) => b.spent - a.spent)
  const kept = limited.filter((group) => group.spent <= group.limit!).length
  const totalJudged = judged(data.total)
  const totalCard = (
    <CardContent>
      <BudgetResult spent={data.total.spent} limit={totalJudged ? data.total.limit! : undefined} label={`Tháng ${number} đã chi`} />
      <JarsNote amount={data.total.fromJars} className="mt-1.5" />
      <KeptLine data={data} line={data.total} />
    </CardContent>
  )

  return (
    <>
      {hasLimit(data.total) ? (
        <Card size="lg" asChild>
          <button
            type="button"
            className="w-full text-left transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            onClick={() => onOpen({ type: "total" })}
          >
            {totalCard}
          </button>
        </Card>
      ) : (
        <Card size="lg">{totalCard}</Card>
      )}
      {limited.length > 0 ? (
        <SettingsGroup title={`Theo nhóm · ${kept}/${limited.length} trong hạn mức`}>
          {limited.map((group) => (
            <LimitRow
              key={group.groupId}
              media={<IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size="sm" />}
              title={group.name}
              figure={
                <>
                  <span className="font-semibold">{formatCompactCurrency(group.spent, 1)}</span>
                  <span className="text-muted-foreground"> / {formatCompactCurrency(group.limit!, 1)}</span>
                </>
              }
              value={group.spent}
              max={group.limit!}
              tone={limitTone(group.spent, group.limit!)}
              caption={
                group.spent > group.limit!
                  ? `Vượt ${formatCompactCurrency(group.spent - group.limit!, 1)}`
                  : `Còn dư ${formatCompactCurrency(group.limit! - group.spent, 1)}`
              }
              onClick={() => onOpen({ type: "group", groupId: group.groupId })}
            />
          ))}
        </SettingsGroup>
      ) : null}
      {others.length > 0 ? (
        <SettingsGroup title="Chưa đặt hạn mức">
          {others.map((group) => (
            <SettingsRow
              key={group.groupId}
              media={<IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size="sm" />}
              title={group.name}
              description={hasLimit(group) ? `Đặt từ tháng ${Number(group.since!.slice(5))}` : undefined}
              value={<Money amount={group.spent} size="sm" tone="muted" />}
              onClick={() => (hasLimit(group) ? onOpen({ type: "group", groupId: group.groupId }) : onShowTransactions([group.groupId]))}
            />
          ))}
        </SettingsGroup>
      ) : null}
    </>
  )
}

/**
 * A limit set or changed: the group's tile and name (or the month's), the
 * amount large, starting from the three-month average rounded up when there
 * is none yet, that average and this month's spending under it; Delete
 * (with undo) beside Save when it exists.
 */
export function BudgetFormSheet({
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
  const name = group?.name ?? "Hạn mức tổng"

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
        <p className="text-sm text-muted-foreground">Áp dụng cho mọi tháng</p>
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
