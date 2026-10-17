"use client"

import * as React from "react"
import { BellRingIcon, ChevronLeftIcon, ChevronRightIcon, GaugeIcon, PencilIcon, PlusIcon, SaveIcon, SparklesIcon, Trash2Icon, TriangleAlertIcon, ZapIcon } from "lucide-react"
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
  limitsConflict,
  monthShare,
  remainingLabel,
  suggestedLimit,
} from "@/lib/budgets/calculations"
import { limitJudges, shiftMonthKey } from "@/lib/budgets/months"
import type { BudgetGroupLine, BudgetLine, BudgetMonth, BudgetMonthLine, BudgetOverview } from "@/lib/budgets/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"
import { cn } from "@/lib/utils"

import { KeptMonths } from "./budget-charts"
import { BudgetDetailSkeleton, BudgetGroupDetail, BudgetTotalDetail, JarsNote } from "./budget-detail"
import { BudgetAdjustHint } from "./budget-adjust-hint"
import { BudgetSpendingList } from "./budget-spending"
import { BudgetAlertSettingsScreen, budgetAlertsSummary } from "./budget-alert-settings"
import { BudgetSuggestSheet, canSuggest } from "./budget-suggest"
import { BudgetResult, BudgetTotal } from "./budget-total"

/** The limit being set: the whole month's, or a group's. */
export type BudgetTarget = { kind: "total" } | { kind: "group"; groupId: string }
type Target = BudgetTarget

function GroupTile({ group, size = "sm" }: { group: BudgetGroupLine; size?: "sm" | "lg" }) {
  return <IconTile icon={categoryIconRegistry[group.iconName]} tone={group.colorName} size={size} />
}

/** A detail screen: the whole month's limit, or a group's. */
/**
 * What a screen of the sheet's spending list shows: some groups' or one
 * category's transactions. Its title differs from the screen it opens from
 * ("Giao dịch Ăn uống" from "Ăn uống"), as the bar takes a screen's buttons
 * when its title changes.
 */
type SpendingFilter = { title: string; groupIds?: string[]; itemId?: string }

type Screen =
  | { type: "total" }
  | { type: "group"; groupId: string }
  | { type: "alerts" }
  | ({ type: "spending" } & SpendingFilter)
  | null

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
          <BudgetsSheetBody overview={overview} onEdit={edit} />
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
}: {
  overview: BudgetOverview
  onEdit: (target: Target) => void
}) {
  const thisMonth = overview.month
  const today = `${thisMonth}-${String(overview.day).padStart(2, "0")}`
  const [month, setMonth] = React.useState(thisMonth)
  // Screens opened one on another (a group, then its transactions): ‹ goes back one.
  const [stack, setStack] = React.useState<NonNullable<Screen>[]>([])
  const screen: Screen = stack.at(-1) ?? null
  const setScreen = React.useCallback((next: Screen) => setStack((current) => (next ? [...current, next] : [])), [])
  const back = React.useCallback(() => setStack((current) => current.slice(0, -1)), [])
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
    screen?.type === "alerts"
      ? { title: "Thông báo hạn mức", onBack: back }
      : screen?.type === "spending"
      ? { title: past ? `${screen.title} · tháng ${number}` : screen.title, onBack: back }
      : screen
      ? {
          title: screen.type === "total" ? (past ? `Hạn mức tổng · tháng ${number}` : "Hạn mức tổng") : past ? `${groupName} · tháng ${number}` : groupName,
          onBack: back,
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

  // In the sheet, on a screen of its own (2026-10-17), not on the transactions page.
  const showTransactions = (filter: SpendingFilter) => setScreen({ type: "spending", ...filter })

  if (screen?.type === "spending") {
    return <BudgetSpendingList month={month} filter={screen} today={today} version={version} />
  }

  if (screen?.type === "alerts") {
    const first = overview.groups.find(hasLimit)
    return (
      <BudgetAlertSettingsScreen
        initial={overview.alerts}
        example={first ? { name: first.name, limit: first.limit! } : undefined}
      />
    )
  }
  if (screen) {
    if (!data) return <BudgetDetailSkeleton />
    if (screen.type === "total" && hasLimit(data.total)) {
      return (
        <BudgetTotalDetail
          month={data}
          // This month only: whether to change the limit.
          hint={past ? null : <BudgetAdjustHint name={null} groupId={null} line={overview.total} />}
          onGroup={(groupId) => {
            if (data.groups.some((group) => group.groupId === groupId && group.limit !== null)) setScreen({ type: "group", groupId })
          }}
          onShowTransactions={showTransactions}
        />
      )
    }
    if (detailGroup && hasLimit(detailGroup)) {
      const line = overview.groups.find((group) => group.groupId === detailGroup.groupId)
      return (
        <BudgetGroupDetail
          month={data}
          group={detailGroup}
          today={today}
          hint={past || !line ? null : <BudgetAdjustHint name={line.name} groupId={line.groupId} line={line} />}
          onShowTransactions={showTransactions}
        />
      )
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
        <ThisMonthList overview={overview} onOpen={setScreen} onEdit={onEdit} />
      )}
    </>
  )
}

/** The six months before, under a month's lead figure; a line of its height while they load. */
function KeptLine({
  month,
  limit,
  kept,
}: {
  month: string
  limit: number | null
  kept: { history: number[]; since: string | null; minMonth: string }
}) {
  if (limit === null) return null
  return (
    <KeptMonths
      history={kept.history}
      limit={limit}
      month={month}
      minMonth={kept.minMonth}
      since={kept.since}
      className="mt-4 border-t border-separator pt-3.5 empty:hidden"
    />
  )
}

/**
 * The head of the whole month's card (2026-10-17, "A"), so it reads apart
 * from the groups' limits below: the gauge tile, "Hạn mức tổng" and what it
 * covers, a chevron when the card opens its screen.
 */
function TotalHeading({ chevron = true }: { chevron?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <IconTile icon={GaugeIcon} tone="neutral" size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-base font-semibold">Hạn mức tổng</p>
        <p className="text-xs text-muted-foreground">Mọi khoản chi trong tháng</p>
      </div>
      {chevron ? <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
    </div>
  )
}

/**
 * How much of the whole month's limit the groups' limits take, under a
 * hairline: "Đã chia cho nhóm 1,2tr / 1,2tr". Since 2026-10-17 they cannot
 * add up to more (limitsConflict); limits set before that still might, and
 * then it says so in amber. Nothing without group limits.
 */
function Allocation({ total, groups }: { total: number; groups: number[] }) {
  if (groups.length === 0) return null
  const shared = groups.reduce((sum, limit) => sum + limit, 0)
  const over = shared > total
  return (
    <div className="mt-4 flex flex-col gap-1.5 border-t border-separator pt-3.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Đã chia cho nhóm</span>
        <span className={cn("font-medium tabular-nums", over && "text-warning")}>
          {formatCompactCurrency(shared, 1)} / {formatCompactCurrency(total, 1)}
        </span>
      </div>
      {over ? (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <TriangleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Các nhóm cộng lại {formatCompactCurrency(shared, 1)}, nhiều hơn hạn mức tổng {formatCompactCurrency(total, 1)}. Giảm hạn mức nhóm cho vừa.
        </p>
      ) : null}
    </div>
  )
}

function ThisMonthList({
  overview,
  onOpen,
  onEdit,
}: {
  overview: BudgetOverview
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
              <TotalHeading />
              <BudgetTotal overview={overview} />
              <JarsNote amount={total.fromJars} className="mt-1.5" />
              <Allocation total={total.limit} groups={limited.map((group) => group.limit)} />
              {/* From the page's data, so the card does not change once the month's detail loads. */}
              <KeptLine month={overview.month} limit={total.limit} kept={overview.kept} />
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
        <SettingsGroup title={`Hạn mức theo nhóm · ${limited.length}`}>
          {limited.map((group) => (
            <LimitRow
              key={group.groupId}
              media={<GroupTile group={group} />}
              title={
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{group.name}</span>
                  {/* A hint to change the limit waits in the group's screen. */}
                  {group.adjust ? <span role="img" aria-label="Có gợi ý chỉnh hạn mức" className="size-1.75 shrink-0 rounded-full bg-warning" /> : null}
                </span>
              }
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

      <SettingsGroup>
        <SettingsRow icon={BellRingIcon} title="Thông báo hạn mức" value={budgetAlertsSummary(overview.alerts)} onClick={() => onOpen({ type: "alerts" })} />
      </SettingsGroup>
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
  onShowTransactions: (filter: SpendingFilter) => void
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
      <TotalHeading chevron={hasLimit(data.total)} />
      <BudgetResult spent={data.total.spent} limit={totalJudged ? data.total.limit! : undefined} label={`Tháng ${number} đã chi`} />
      <JarsNote amount={data.total.fromJars} className="mt-1.5" />
      <KeptLine month={data.month} limit={data.total.limit} kept={{ history: data.total.history, since: data.total.since, minMonth: data.minMonth }} />
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
        <SettingsGroup title={`Hạn mức theo nhóm · ${kept}/${limited.length} trong hạn mức`}>
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
              onClick={() =>
                hasLimit(group)
                  ? onOpen({ type: "group", groupId: group.groupId })
                  : onShowTransactions({ title: `Giao dịch ${group.name}`, groupIds: [group.groupId] })
              }
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
      {open && line ? <BudgetForm overview={overview} group={group} line={line} onDone={() => onOpenChange(false)} /> : null}
    </PageSheet>
  )
}

function BudgetForm({
  overview,
  group,
  line,
  onDone,
}: {
  overview: BudgetOverview
  group?: BudgetGroupLine
  line: BudgetLine
  onDone: () => void
}) {
  const suggested = suggestedLimit(line.average)
  const [amount, setAmount] = React.useState<number | null>(line.limit ?? suggested)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const name = group?.name ?? "Hạn mức tổng"

  // The rule between limits, said as the amount is typed (the server says the same): the groups fit in the month's.
  const others = overview.groups.filter((other) => other.limit !== null && other.groupId !== group?.groupId)
  const monthLimit = overview.total.limit
  const ruleError = !amount
    ? null
    : group
      ? limitsConflict(monthLimit, [...others.map((other) => ({ name: other.name, limit: other.limit! })), { name: group.name, limit: amount }], group.name)
      : limitsConflict(amount, others.map((other) => ({ name: other.name, limit: other.limit! })), "total")
  const shownError = error ?? ruleError
  const sharedByOthers = others.reduce((sum, other) => sum + other.limit!, 0)

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
          invalid={Boolean(shownError)}
          required
        />
        {shownError ? <FieldError className="px-4 text-center">{shownError}</FieldError> : null}
      </div>

      <SettingsGroup>
        {/* What the rule weighs it against: the month's limit and what the other groups leave of it, or what the groups share. */}
        {group && monthLimit !== null ? (
          <SettingsRow
            title="Hạn mức tổng"
            value={`${formatCompactCurrency(monthLimit, 1)} · còn chia được ${formatCompactCurrency(Math.max(monthLimit - sharedByOthers, 0), 1)}`}
          />
        ) : null}
        {!group && others.length > 0 ? <SettingsRow title="Đã chia cho nhóm" value={formatCompactCurrency(sharedByOthers, 1)} /> : null}
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
          <Button type="submit" className="flex-1" disabled={pending || Boolean(ruleError)}>
            {pending ? <Spinner /> : <SaveIcon />}
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </PageSheetFooter>
    </form>
  )
}
