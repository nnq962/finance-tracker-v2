import "server-only"

import type { Account } from "@/lib/accounts/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { getPaymentMetrics } from "@/lib/debts/calculations"
import type { Contact, Debt } from "@/lib/debts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel, formatShortDate, formatTime, toDateKey } from "@/lib/format-date"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"
import type { AccountFlow, Transaction } from "@/lib/transactions/types"

import type { AccountMark, Answer, AnswerBlock, AnswerIcon, AnswerRow, QuestionPlan } from "./types"

/** What answering reads, loaded by the caller for the ranges it is asked for. */
export type AnswerSources = {
  today: string
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  contacts: Contact[]
  /** Loaded only for debt questions. */
  debts: () => Promise<Debt[]>
  /** Cash flow and transfers in [start, end) (date keys, Vietnam days), loans left out. */
  transactions: (start: string, end: string) => Promise<Transaction[]>
  /** Money in and out of each account in [start, end). */
  flows: (start: string, end: string) => Promise<Record<string, AccountFlow>>
  /** Loans' repayments in [start, end), shaped as transactions: in for money back, out for money paid back. */
  debtPayments: (start: string, end: string) => Promise<Transaction[]>
}

/* ------------------------------------------------------------------ dates */

const day = (key: string) => new Date(`${key}T00:00:00Z`)
const key = (date: Date) => date.toISOString().slice(0, 10)
const addDays = (dateKey: string, days: number) => key(new Date(day(dateKey).getTime() + days * 86_400_000))
const monthStart = (year: number, month: number) => key(new Date(Date.UTC(year, month - 1, 1)))
const addMonths = (dateKey: string, months: number) => {
  const date = day(dateKey)
  return monthStart(date.getUTCFullYear(), date.getUTCMonth() + 1 + months)
}
const addYears = (dateKey: string, years: number) => {
  const date = day(dateKey)
  const shifted = new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()))
  // 29/2 a year on is 1/3: the last day of February instead.
  return shifted.getUTCMonth() === date.getUTCMonth() ? key(shifted) : key(new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth() + 1, 0)))
}
const daysBetween = (start: string, end: string) => Math.round((day(end).getTime() - day(start).getTime()) / 86_400_000)
const yearOf = (dateKey: string) => Number(dateKey.slice(0, 4))
const monthOf = (dateKey: string) => Number(dateKey.slice(5, 7))
const lastDay = (end: string) => addDays(end, -1)

/** A stretch of days, [start, end), with how it is said. */
type Range = { start: string; end: string; label: string; kind: "day" | "week" | "month" | "year" | "days" | "all" }

/** The months a range touches, as their first days, oldest first. */
function monthsIn(range: Range) {
  const months: string[] = []
  for (let month = range.start.slice(0, 8) + "01"; month < range.end; month = addMonths(month, 1)) months.push(month)
  return months
}

function spanLabel(start: string, end: string) {
  const last = lastDay(end)
  if (start === last) return formatShortDate(start)
  return monthOf(start) === monthOf(last) && yearOf(start) === yearOf(last)
    ? `${Number(start.slice(8))}–${Number(last.slice(8))}/${monthOf(last)}`
    : `${formatShortDate(start)}–${formatShortDate(last)}`
}

function monthLabel(start: string, today: string) {
  return yearOf(start) === yearOf(today) ? `tháng ${monthOf(start)}` : `tháng ${monthOf(start)}/${yearOf(start)}`
}

/** The days a plan's period covers, up to today: nothing after today has happened. */
function resolvePeriod(period: QuestionPlan["period"], today: string): Range {
  const tomorrow = addDays(today, 1)
  const clip = (end: string) => (end > tomorrow ? tomorrow : end)
  const monday = addDays(today, -((day(today).getUTCDay() + 6) % 7))
  switch (period.preset) {
    case "today":
      return { start: today, end: tomorrow, label: "hôm nay", kind: "day" }
    case "yesterday":
      return { start: addDays(today, -1), end: today, label: "hôm qua", kind: "day" }
    case "this_week":
      return { start: monday, end: tomorrow, label: "tuần này", kind: "week" }
    case "last_week":
      return { start: addDays(monday, -7), end: monday, label: "tuần trước", kind: "week" }
    case "this_month": {
      const start = monthStart(yearOf(today), monthOf(today))
      return { start, end: tomorrow, label: monthLabel(start, today), kind: "month" }
    }
    case "last_month": {
      const start = addMonths(today, -1)
      return { start, end: addMonths(start, 1), label: monthLabel(start, today), kind: "month" }
    }
    case "this_year":
      return { start: `${yearOf(today)}-01-01`, end: tomorrow, label: "năm nay", kind: "year" }
    case "last_year":
      return { start: `${yearOf(today) - 1}-01-01`, end: `${yearOf(today)}-01-01`, label: `năm ${yearOf(today) - 1}`, kind: "year" }
    case "last_days": {
      const days = period.days ?? 7
      return { start: addDays(today, -(days - 1)), end: tomorrow, label: `${days} ngày qua`, kind: "days" }
    }
    case "last_months": {
      const months = period.months ?? 6
      return { start: addMonths(today, -(months - 1)), end: tomorrow, label: `${months} tháng gần đây`, kind: "days" }
    }
    case "month": {
      const month = period.month ?? monthOf(today)
      // A month not yet reached this year is last year's.
      const year = period.year ?? (month <= monthOf(today) ? yearOf(today) : yearOf(today) - 1)
      const start = monthStart(year, month)
      return { start, end: clip(addMonths(start, 1)), label: monthLabel(start, today), kind: "month" }
    }
    case "year": {
      const year = period.year ?? yearOf(today)
      return { start: `${year}-01-01`, end: clip(`${year + 1}-01-01`), label: year === yearOf(today) ? "năm nay" : `năm ${year}`, kind: "year" }
    }
    case "range": {
      const from = period.from ?? today
      const to = period.to && period.to >= from ? period.to : from
      const end = clip(addDays(to, 1))
      return { start: from, end, label: spanLabel(from, end), kind: "days" }
    }
    default:
      return { start: "2000-01-01", end: tomorrow, label: "từ trước tới nay", kind: "all" }
  }
}

/**
 * The stretch a period is compared with: the one just before, as long (the
 * same days of last month for a month so far), or the same days a year back.
 */
function comparedRange(range: Range, compare: QuestionPlan["compare"], today: string): Range | null {
  if (compare === "none" || range.kind === "all") return null
  if (compare === "last_year") {
    const start = addYears(range.start, -1)
    const end = addYears(range.end, -1)
    return { start, end, label: spanLabel(start, end), kind: range.kind }
  }
  if (range.kind === "month") {
    const start = addMonths(range.start, -1)
    const fullEnd = addMonths(start, 1)
    // A whole month against the whole month before; a month so far against as many days of it.
    const whole = range.end === addMonths(range.start, 1)
    const end = addDays(start, daysBetween(range.start, range.end))
    return whole || end >= fullEnd
      ? { start, end: fullEnd, label: monthLabel(start, today), kind: "month" }
      : { start, end, label: spanLabel(start, end), kind: "month" }
  }
  if (range.kind === "year") {
    const start = addYears(range.start, -1)
    return { start, end: addYears(range.end, -1), label: `năm ${yearOf(start)}`, kind: "year" }
  }
  const length = daysBetween(range.start, range.end)
  const start = addDays(range.start, -(range.kind === "week" ? 7 : length))
  const end = addDays(start, length)
  const label = range.kind === "day" ? formatDayLabel(start, today).toLowerCase() : range.kind === "week" ? "tuần trước" : spanLabel(start, end)
  return { start, end, label, kind: range.kind }
}

/** "So với tháng trước": how a follow-up chip names the period before, plainly. */
function previousName(range: Range) {
  return { day: "hôm trước", week: "tuần trước", month: "tháng trước", year: "năm trước", days: "kỳ trước", all: "kỳ trước" }[range.kind]
}

/** How the period reads in a kicker: a month or a year so far says up to which day. */
function periodTitle(range: Range, today: string) {
  const sofar = range.end === addDays(today, 1) && (range.kind === "month" || range.kind === "year" || range.kind === "week")
  return sofar && daysBetween(range.start, range.end) > 1 ? `${range.label} (${spanLabel(range.start, range.end)})` : range.label
}

/**
 * "So với tháng 8" after a question on September: a model may move the
 * period to August, the one to compare with, rather than keep September and
 * compare. When a follow-up asks to compare and its period is the very one
 * the previous period would be compared with, the previous period is kept.
 */
export function keepComparedPeriod(plan: QuestionPlan, previous: QuestionPlan | undefined, today: string): QuestionPlan {
  if (!previous || plan.compare === "none") return plan
  const was = resolvePeriod(previous.period, today)
  const now = resolvePeriod(plan.period, today)
  const target = comparedRange(was, plan.compare, today)
  const sameMonth = target && was.kind === "month" && now.start === target.start
  return target && (sameMonth || (now.start === target.start && now.end === target.end)) ? { ...plan, period: previous.period } : plan
}

/* ------------------------------------------------------------- the pieces */

const money = (amount: number) => formatCurrency(amount)
const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("vi-VN") + text.slice(1)

/** An account's logo, as the app shows it beside the account. */
const markOf = (account: Account): AccountMark => ({
  name: account.name,
  type: account.type,
  logoFallback: account.logoFallback,
  ...(account.institutionName ? { institutionName: account.institutionName } : {}),
  ...(account.logoUrl ? { logoUrl: account.logoUrl } : {}),
})

const accountIcon = (account?: Account): AnswerIcon => (account ? { kind: "account", account: markOf(account) } : { kind: "account" })

/** Lower case without marks, so "pho" finds "Phở". */
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi-VN")

type Lookup = {
  group: (id?: string) => CategoryGroup | undefined
  category: (id?: string) => { name: string; icon: CategoryIconName; color: CategoryColorName } | undefined
  account: (id?: string) => Account | undefined
}

function lookups(sources: AnswerSources): Lookup {
  const groups = new Map(sources.categoryGroups.map((group) => [group.id, group]))
  const categories = new Map(
    sources.categoryGroups.flatMap((group) =>
      group.items.map((item) => [item.id, { name: item.name, icon: item.iconName, color: group.colorName }] as const),
    ),
  )
  const accounts = new Map(sources.accounts.map((account) => [account.id, account]))
  return {
    group: (id) => (id ? groups.get(id) : undefined),
    category: (id) => (id ? categories.get(id) : undefined),
    account: (id) => (id ? accounts.get(id) : undefined),
  }
}

function transactionIcon(transaction: Transaction, look: Lookup): AnswerIcon {
  if (transaction.kind === "transfer") return { kind: "transfer" }
  const category = look.category(transaction.categoryId)
  return category ? { kind: "category", icon: category.icon, color: category.color } : accountIcon(look.account(transaction.accountId))
}

function transactionRow(transaction: Transaction, look: Lookup, sub: string): AnswerRow {
  const amount = Math.abs(transaction.amount)
  return {
    icon: transactionIcon(transaction, look),
    name: transaction.note?.trim() || transaction.title,
    sub,
    amount: transaction.kind === "expense" ? -amount : amount,
    amountTone: transaction.kind === "income" ? "income" : transaction.kind === "expense" ? "expense" : "plain",
  }
}

const accountOf = (transaction: Transaction) =>
  transaction.kind === "transfer"
    ? `${transaction.fromAccountName ?? "Tài khoản"} → ${transaction.toAccountName ?? "Tài khoản"}`
    : (transaction.accountName ?? "")

/**
 * Shares of a whole as bars: the largest few and the rest together, or, for
 * "the least", the smallest few alone, smallest first. Bars are against the
 * whole either way.
 */
function barsBlock(
  entries: { icon: AnswerIcon; name: string; amount: number }[],
  most: number,
  order: "most" | "least" = "most",
): AnswerBlock | null {
  const sorted = entries
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => (order === "least" ? left.amount - right.amount : right.amount - left.amount))
  if (sorted.length < 2) return null
  const total = sorted.reduce((sum, entry) => sum + entry.amount, 0)
  const shown = sorted.length > most ? sorted.slice(0, order === "least" ? most : most - 1) : sorted
  const rest = order === "least" ? [] : sorted.slice(shown.length)
  const rows = [
    ...shown,
    ...(rest.length
      ? [{ icon: { kind: "account" } as AnswerIcon, name: `Khác (${rest.length} mục)`, amount: rest.reduce((sum, entry) => sum + entry.amount, 0) }]
      : []),
  ].map((entry) => ({ ...entry, share: Math.max(2, Math.round((entry.amount / total) * 100)) }))
  return { type: "bars", rows }
}

/* ------------------------------------------------------------ the answers */

const measureNames = { spending: "Chi tiêu", income: "Thu nhập", net: "Thu chi", transactions: "Giao dịch", transfers: "Chuyển khoản" } as const

/** Works out the answer to a plan; every figure comes from the user's records here. */
export async function answerQuestion(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  switch (plan.measure) {
    case "net_worth":
      return answerNetWorth(sources)
    case "balance":
      return answerBalance(plan, sources)
    case "account_info":
      return answerAccountInfo(plan, sources)
    case "account_flow":
      return answerAccountFlow(plan, sources)
    case "lent":
    case "borrowed":
      return plan.debtStatus === "settled" ? answerSettledDebts(plan, sources) : answerDebts(plan, sources)
    case "debts":
      return plan.debtStatus === "settled" ? answerSettledDebts(plan, sources) : answerDebtsBoth(sources)
    case "debts_due":
      return answerDebtsDue(sources)
    case "collected":
    case "repaid":
      // "Đã trả xong" read as repayments: it asks for the debts paid off.
      return plan.debtStatus === "settled"
        ? answerSettledDebts({ ...plan, measure: "debts" }, sources)
        : answerRepayments(plan, sources)
    case "new_lent":
    case "new_borrowed":
      return answerNewDebts(plan, sources)
    default:
      return answerFlow(plan, sources)
  }
}

async function answerFlow(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const look = lookups(sources)
  const measure = plan.measure as "spending" | "income" | "net" | "transactions" | "transfers"
  const range = resolvePeriod(plan.period, today)
  const before = measure === "transactions" || measure === "transfers" ? null : comparedRange(range, plan.compare, today)

  const groupIds = new Set(plan.groupIds)
  const categoryIds = new Set(plan.categoryIds)
  const accountIds = new Set(plan.accountIds)
  const search = fold(plan.search)
  const kinds =
    measure === "spending"
      ? ["expense"]
      : measure === "income"
        ? ["income"]
        : measure === "net"
          ? ["expense", "income"]
          : measure === "transfers"
            ? ["transfer"]
            : ["expense", "income", "transfer"]
  // What the user left out of the figures is left out of every sum; a list of
  // the movements themselves still shows it, and a question about just those
  // ("không tính vào thống kê") is about nothing else.
  const listing = plan.view === "list" || measure === "transactions"
  const keep = (transaction: Transaction) =>
    (plan.onlyExcluded ? transaction.excluded === true : listing || !transaction.excluded) &&
    (plan.minAmount === null || Math.abs(transaction.amount) >= plan.minAmount) &&
    (plan.maxAmount === null || Math.abs(transaction.amount) <= plan.maxAmount) &&
    kinds.includes(transaction.kind) &&
    (groupIds.size + categoryIds.size === 0 ||
      groupIds.has(transaction.categoryGroupId ?? "") ||
      categoryIds.has(transaction.categoryId ?? "")) &&
    (accountIds.size === 0 ||
      accountIds.has(transaction.accountId ?? "") ||
      accountIds.has(transaction.fromAccountId ?? "") ||
      accountIds.has(transaction.toAccountId ?? "")) &&
    (!search || fold(`${transaction.note ?? ""} ${transaction.title} ${transaction.categoryName ?? ""}`).includes(search))

  const [current, previous] = await Promise.all([
    sources.transactions(range.start, range.end).then((rows) => rows.filter(keep)),
    before ? sources.transactions(before.start, before.end).then((rows) => rows.filter(keep)) : Promise.resolve(null),
  ])

  const sum = (rows: Transaction[], kind?: string) =>
    rows
      .filter((row) => (plan.onlyExcluded || !row.excluded) && (!kind || row.kind === kind))
      .reduce((total, row) => total + Math.abs(row.amount), 0)
  const value = (rows: Transaction[]) => (measure === "net" ? sum(rows, "income") - sum(rows, "expense") : sum(rows))

  // What the answer is about: the categories asked for, a word searched, or the measure.
  const names = [
    ...plan.groupIds.map((id) => look.group(id)?.name),
    ...plan.categoryIds.map((id) => look.category(id)?.name),
  ].filter(Boolean)
  const accountNames = plan.accountIds.map((id) => look.account(id)?.name).filter(Boolean)
  const amountRange =
    plan.minAmount !== null && plan.maxAmount !== null
      ? ` ${money(plan.minAmount)}–${money(plan.maxAmount)}`
      : plan.minAmount !== null
        ? ` từ ${money(plan.minAmount)}`
        : plan.maxAmount !== null
          ? ` đến ${money(plan.maxAmount)}`
          : ""
  const subject =
    (names.length ? names.join(", ") : search ? `“${plan.search}”` : measureNames[measure]) +
    amountRange +
    (plan.onlyExcluded ? " không tính vào thống kê" : "")
  const via = accountNames.length
    ? measure === "spending"
      ? ` bằng ${accountNames.join(", ")}`
      : measure === "income"
        ? ` vào ${accountNames.join(", ")}`
        : ` · ${accountNames.join(", ")}`
    : ""
  const kicker = `${subject}${via} · ${periodTitle(range, today)}`

  const total = value(current)
  const tone = measure === "income" ? "income" : measure === "net" ? (total >= 0 ? "income" : "expense") : "plain"
  const count = current.length
  const days = Math.max(1, daysBetween(range.start, range.end))
  const monthKey = range.start.slice(0, 7)
  const link = { label: "Mở trong Giao dịch", href: `/transactions?month=${monthKey}` }

  if (count === 0 && !previous?.length) {
    return {
      kicker,
      figure: { amount: 0, tone: "plain" },
      line: "Chưa có khoản nào.",
      blocks: [],
      followUps: range.kind === "all" ? [] : [`Còn ${previousName(range)}?`],
    }
  }

  // By group, or by category once the question is about one group.
  const splitBy = (rows: Transaction[], by: "group" | "category" | "account") => {
    const totals = new Map<string, { icon: AnswerIcon; name: string; amount: number }>()
    for (const row of rows) {
      const id = by === "group" ? row.categoryGroupId : by === "category" ? row.categoryId : row.accountId
      const entryKey = id ?? "none"
      const entry =
        totals.get(entryKey) ??
        (() => {
          const group = look.group(row.categoryGroupId)
          const category = look.category(row.categoryId)
          const created =
            by === "account"
              ? { icon: accountIcon(look.account(row.accountId)), name: row.accountName ?? "Tài khoản", amount: 0 }
              : by === "group"
                ? {
                    icon: group ? ({ kind: "category", icon: group.iconName, color: group.colorName } as AnswerIcon) : ({ kind: "account" } as AnswerIcon),
                    name: group?.name ?? row.categoryGroupName ?? "Khác",
                    amount: 0,
                  }
                : {
                    icon: category ? ({ kind: "category", icon: category.icon, color: category.color } as AnswerIcon) : ({ kind: "account" } as AnswerIcon),
                    name: category?.name ?? row.categoryName ?? "Khác",
                    amount: 0,
                  }
          totals.set(entryKey, created)
          return created
        })()
      entry.amount += Math.abs(row.amount)
    }
    return [...totals.values()]
  }
  const oneGroup = plan.groupIds.length === 1 && plan.categoryIds.length === 0
  const naturalSplit = oneGroup ? "category" : "group"

  /* over time: day by day, or month by month */
  if (plan.view === "by_day" || plan.view === "by_month") {
    const byMonth = plan.view === "by_month"
    const slots = byMonth
      ? monthsIn(range).map((start) => ({ start, end: addMonths(start, 1), label: `T${monthOf(start)}` }))
      : Array.from({ length: Math.min(62, days) }, (_, index) => {
          const start = addDays(range.start, index)
          return { start, end: addDays(start, 1), label: String(Number(start.slice(8))) }
        })
    const inSlot = (row: Transaction, slot: { start: string; end: string }) => {
      const dateKey = toDateKey(row.occurredAt)
      return dateKey >= slot.start && dateKey < slot.end
    }
    const two = measure === "net"
    const columns = slots.map((slot) => {
      const rows = current.filter((row) => inSlot(row, slot))
      return { label: slot.label, values: two ? [sum(rows, "income"), sum(rows, "expense")] : [value(rows)] }
    })
    // The busiest (or quietest) day or month, among those with anything.
    const scored = columns.map((column, index) => ({ index, amount: two ? column.values[0] - column.values[1] : column.values[0] }))
    const candidates = scored.filter((item) => columns[item.index].values.some(Boolean))
    const pick = candidates.sort((left, right) => (plan.order === "least" ? left.amount - right.amount : right.amount - left.amount))[0]
    const slotName = (index: number) =>
      byMonth ? monthLabel(slots[index].start, today) : formatDayLabel(slots[index].start, today)
    const spread = byMonth ? Math.max(1, slots.length) : Math.max(1, slots.length)
    return {
      kicker: `${subject}${via} theo ${byMonth ? "tháng" : "ngày"} · ${periodTitle(range, today)}`,
      figure: { amount: total, tone },
      line: pick
        ? two
          ? `Thu ${money(sum(current, "income"))}, chi ${money(sum(current, "expense"))}. ${capitalize(slotName(pick.index))} ${plan.order === "least" ? "dư ít nhất" : "dư nhiều nhất"}: ${money(pick.amount)}.`
          : `${plan.order === "least" ? "Ít nhất" : "Nhiều nhất"}: ${slotName(pick.index)}, ${money(pick.amount)}. Trung bình ${money(Math.round(total / spread))} mỗi ${byMonth ? "tháng" : "ngày"}.`
        : "Chưa có khoản nào.",
      blocks: [
        {
          type: "columns",
          series: two
            ? [
                { name: "Thu", tone: "income" },
                { name: "Chi", tone: "plain" },
              ]
            : [{ name: subject, tone: measure === "income" ? "income" : "plain" }],
          columns,
          highlight: two ? undefined : pick?.index,
        },
      ],
      followUps: byMonth ? ["Tháng này tiêu vào đâu?"] : ["Khoản nào lớn nhất?"],
      link,
    }
  }

  /* comparison */
  if (previous && before) {
    const was = value(previous)
    const change = total - was
    const blocks: AnswerBlock[] = []
    const highest = Math.max(Math.abs(total), Math.abs(was), 1)
    blocks.push({
      type: "compare",
      rows: [
        { label: periodTitle(range, today), amount: total, share: Math.round((Math.abs(total) / highest) * 100) },
        { label: before.label, amount: was, share: Math.round((Math.abs(was) / highest) * 100) },
      ],
    })
    if (measure !== "net") {
      // What changed the most, by group (or category).
      const now = new Map(splitBy(current, naturalSplit).map((entry) => [entry.name, entry]))
      const then = new Map(splitBy(previous, naturalSplit).map((entry) => [entry.name, entry]))
      const changes = [...new Set([...now.keys(), ...then.keys()])]
        .map((name) => {
          const entry = now.get(name) ?? then.get(name)!
          const difference = (now.get(name)?.amount ?? 0) - (then.get(name)?.amount ?? 0)
          return { entry, difference, amount: now.get(name)?.amount ?? 0 }
        })
        .filter((item) => item.difference !== 0)
        .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))
        .slice(0, 3)
      if (changes.length > 1) {
        blocks.push({
          type: "rows",
          groups: [
            {
              rows: changes.map(({ entry, difference, amount }) => ({
                icon: entry.icon,
                name: entry.name,
                sub: `${difference > 0 ? "+" : "−"}${money(Math.abs(difference))} so với ${before.label}`,
                amount: measure === "spending" ? -amount : amount,
                amountTone: measure === "income" ? "income" : "expense",
              })),
            },
          ],
        })
      }
    }
    const word = measure === "spending" ? ["Chi nhiều hơn", "Chi ít hơn"] : measure === "income" ? ["Nhận nhiều hơn", "Nhận ít hơn"] : ["Dư nhiều hơn", "Dư ít hơn"]
    return {
      kicker: `${subject}${via} · ${periodTitle(range, today)} so với ${before.label}`,
      figure: { amount: total, tone },
      delta: was > 0 && measure !== "net" ? { current: total, previous: was, goodWhen: measure === "income" ? "up" : "down", comparedTo: before.label } : undefined,
      line: change === 0 ? `Bằng ${before.label}` : `${change > 0 ? word[0] : word[1]} ${money(Math.abs(change))}`,
      blocks,
      followUps: ["Khoản nào lớn nhất?", "Xem các khoản"],
      link,
    }
  }

  /* the largest first */
  if (plan.view === "top") {
    // "The largest" alone still shows the few after it.
    const limit = Math.max(plan.limit ?? 5, 3)
    const least = plan.order === "least"
    const sorted = current
      .filter((row) => !row.excluded)
      .sort((left, right) => (least ? -1 : 1) * (Math.abs(right.amount) - Math.abs(left.amount)))
      .slice(0, limit)
    const first = sorted[0]
    return {
      kicker: `${measure === "income" ? "Khoản thu" : measure === "spending" ? "Khoản chi" : "Giao dịch"} ${least ? "nhỏ" : "lớn"} nhất · ${subject === measureNames[measure] ? "" : `${subject} · `}${periodTitle(range, today)}`,
      figure: { amount: Math.abs(first.amount), tone },
      line: `${first.note?.trim() || first.title}, ${formatShortDate(toDateKey(first.occurredAt))}`,
      blocks: [
        {
          type: "rows",
          groups: [
            {
              rows: sorted.map((row, index) =>
                transactionRow(
                  { ...row, note: `${index + 1} · ${row.note?.trim() || row.title}` },
                  look,
                  `${formatShortDate(toDateKey(row.occurredAt))} · ${accountOf(row)}`,
                ),
              ),
            },
          ],
        },
      ],
      followUps: [measure === "income" ? "Thu từ đâu nhiều nhất?" : least ? "Tiêu vào đâu ít nhất?" : "Tiêu vào đâu nhiều nhất?"],
      link,
    }
  }

  /* the movements themselves */
  if (plan.view === "list" || measure === "transactions") {
    const limit = plan.limit ?? 6
    const sorted = [...current].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    const shown = sorted.slice(0, limit)
    const groups: { heading?: string; rows: AnswerRow[] }[] = []
    for (const row of shown) {
      const heading = formatDayLabel(toDateKey(row.occurredAt), today)
      const group = groups.at(-1)?.heading === heading ? groups.at(-1)! : (groups.push({ heading, rows: [] }), groups.at(-1)!)
      group.rows.push(transactionRow(row, look, `${formatTime(row.occurredAt)} · ${accountOf(row)}`))
    }
    const more = sorted.length - shown.length
    return {
      kicker,
      figure: measure === "transactions" ? undefined : { amount: measure === "spending" ? -total : total, tone: measure === "spending" ? "plain" : tone },
      line: `${count} khoản${more > 0 ? `, ${shown.length} khoản gần nhất ở dưới` : ""}`,
      blocks: [{ type: "rows", groups }],
      followUps: measure === "transactions" || range.kind === "all" ? [] : ["Khoản nào lớn nhất?", `So với ${previousName(range)}`],
      link,
    }
  }

  /* one figure, or split up */
  const split =
    plan.view === "by_account" ? "account" : plan.view === "by_category" ? "category" : plan.view === "by_group" ? naturalSplit : naturalSplit
  const blocks: AnswerBlock[] = []
  if (measure === "net") {
    const income = sum(current, "income")
    const spending = sum(current, "expense")
    const highest = Math.max(income, spending, 1)
    blocks.push({
      type: "compare",
      rows: [
        { label: "Thu", amount: income, share: Math.round((income / highest) * 100) },
        { label: "Chi", amount: spending, share: Math.round((spending / highest) * 100) },
      ],
    })
  } else if (measure === "transfers") {
    // Moves between the user's own accounts: no categories to split by.
  } else if (plan.order === "least" && plan.view !== "total") {
    // "Chi gì ít nhất": the smallest part is the answer, the few after it below.
    const parts = splitBy(current, split).filter((part) => part.amount > 0).sort((left, right) => left.amount - right.amount)
    const bars = barsBlock(parts, 6, "least")
    const lowest = parts[0]
    if (lowest) {
      return {
        kicker: `${measure === "income" ? "Thu" : "Chi"} ít nhất · ${subject === measureNames[measure] ? "" : `${subject} · `}${periodTitle(range, today)}`,
        figure: { amount: lowest.amount, tone },
        line: `${lowest.name}, trên tổng ${money(total)}`,
        blocks: bars ? [bars] : [],
        followUps: [measure === "income" ? "Thu từ đâu nhiều nhất?" : "Tiêu vào đâu nhiều nhất?", "Khoản nào nhỏ nhất?"],
        link,
      }
    }
  } else {
    const bars = barsBlock(splitBy(current, split), plan.view === "total" ? 4 : 6)
    if (bars) blocks.push(bars)
  }
  const average = measure === "net" ? null : Math.round(total / days)
  return {
    kicker,
    figure: { amount: total, tone },
    // A daily average only over a week or more with a fair few entries.
    line:
      measure === "net"
        ? `Thu ${money(sum(current, "income"))}, chi ${money(sum(current, "expense"))}`
        : measure === "transfers"
          ? `${count} lần chuyển${current.some((row) => row.fee) ? `, phí ${money(current.reduce((fees, row) => fees + (row.fee ?? 0), 0))}` : ""}`
        : `${count} khoản${days >= 7 && count >= 5 && average ? `, trung bình ${money(average)} mỗi ngày` : ""}`,
    blocks,
    followUps: [
      range.kind === "all" ? null : `So với ${previousName(range)}`,
      measure === "net" ? null : "Khoản nào lớn nhất?",
      measure === "net" ? null : "Xem các khoản",
    ].filter((text): text is string => Boolean(text)),
    link,
  }
}

/** Net worth as the overview counts it: every account, plus what others owe, less what the user owes. */
async function answerNetWorth(sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const cash = sources.accounts.reduce((sum, account) => sum + account.balance, 0)
  let receivable = 0
  let payable = 0
  for (const debt of await sources.debts()) {
    const remaining = getPaymentMetrics(debt, today).remainingAmount
    if (debt.direction === "lent") receivable += remaining
    else payable += remaining
  }
  const total = cash + receivable - payable
  const rows: AnswerRow[] = [
    { icon: { kind: "account" }, name: "Tiền trong tài khoản", sub: `${sources.accounts.filter((account) => account.status === "active").length} tài khoản`, amount: cash, amountTone: cash < 0 ? "expense" : "plain" },
    ...(receivable ? [{ icon: { kind: "initials", text: "+" } as AnswerIcon, name: "Người khác nợ bạn", amount: receivable, amountTone: "income" as const }] : []),
    ...(payable ? [{ icon: { kind: "initials", text: "−" } as AnswerIcon, name: "Bạn đang nợ", amount: -payable, amountTone: "expense" as const }] : []),
  ]
  return {
    kicker: "Tài sản ròng",
    figure: { amount: total, tone: total < 0 ? "expense" : "plain" },
    line: "Số dư các tài khoản, cộng tiền người khác nợ, trừ tiền bạn đang nợ",
    blocks: [{ type: "rows", groups: [{ rows }] }],
    followUps: ["Số dư các tài khoản", "Ai đang nợ tôi?"],
    link: { label: "Mở Tổng quan", href: "/overview" },
  }
}

async function answerBalance(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const active = sources.accounts.filter((account) => account.status === "active")
  const chosen = plan.accountIds.length ? active.filter((account) => plan.accountIds.includes(account.id)) : active
  const total = chosen.reduce((sum, account) => sum + account.balance, 0)

  if (chosen.length === 1) {
    const [account] = chosen
    const start = monthStart(yearOf(today), monthOf(today))
    const flow = (await sources.flows(start, addDays(today, 1)))[account.id]
    return {
      kicker: `Số dư · ${account.name}`,
      figure: { amount: account.balance, tone: account.balance < 0 ? "expense" : "plain" },
      line: flow ? `Tháng ${monthOf(today)}: vào ${money(flow.moneyIn)}, ra ${money(flow.moneyOut)}` : undefined,
      blocks: [],
      followUps: [`Tháng này chi gì bằng ${account.name}?`, "Tất cả tài khoản"],
      link: { label: "Mở trong Tài khoản", href: "/budget" },
    }
  }

  return {
    kicker: `Số dư · ${chosen.length} tài khoản`,
    figure: { amount: total, tone: total < 0 ? "expense" : "plain" },
    blocks: [
      {
        type: "rows",
        groups: [
          {
            rows: [...chosen]
              .sort((left, right) => right.balance - left.balance)
              .slice(0, 8)
              .map((account) => ({
                icon: accountIcon(account),
                name: account.name,
                amount: account.balance,
                amountTone: account.balance < 0 ? "expense" : "plain",
              })),
          },
        ],
      },
    ],
    followUps: ["Tháng này tiêu bao nhiêu?"],
    link: { label: "Mở trong Tài khoản", href: "/budget" },
  }
}

async function answerDebts(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  if (plan.contactIds.length === 1) {
    const detail = await answerDebtDetail(plan, sources)
    if (detail) return detail
  }
  const lent = plan.measure === "lent"
  const contacts = new Map(sources.contacts.map((contact) => [contact.id, contact]))
  const debts = (await sources.debts()).filter(
    (debt) =>
      debt.direction === (lent ? "lent" : "borrowed") &&
      debt.status !== "settled" &&
      (plan.contactIds.length === 0 || plan.contactIds.includes(debt.contactId)),
  )

  // One row per person: what is left, and the nearest due date.
  const people = new Map<string, { contact?: Contact; amount: number; due?: string }>()
  for (const debt of debts) {
    const remaining = getPaymentMetrics(debt, today).remainingAmount
    if (remaining <= 0) continue
    const person = people.get(debt.contactId) ?? { contact: contacts.get(debt.contactId), amount: 0 }
    person.amount += remaining
    if (debt.dueAt && (!person.due || debt.dueAt < person.due)) person.due = debt.dueAt
    people.set(debt.contactId, person)
  }
  const rows = [...people.values()].sort((left, right) => right.amount - left.amount)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const late = rows.filter((row) => row.due && row.due < today).length

  const who = lent ? "Đang nợ bạn" : "Bạn đang nợ"
  if (rows.length === 0) {
    return {
      kicker: who,
      figure: { amount: 0, tone: "plain" },
      line: lent ? "Không ai đang nợ bạn." : "Bạn không nợ ai.",
      blocks: [],
      followUps: [lent ? "Mình đang nợ ai?" : "Ai đang nợ tôi?"],
      link: { label: "Mở trong Vay nợ", href: "/debts" },
    }
  }
  const only = rows.length === 1 && plan.contactIds.length === 1 ? rows[0].contact?.name : undefined
  return {
    kicker: only ? (lent ? `${only} đang nợ bạn` : `Bạn đang nợ ${only}`) : `${who} · ${rows.length} người`,
    figure: { amount: total, tone: lent ? "income" : "plain" },
    line: only ? (late ? "Đã quá hạn" : undefined) : late ? `${late} người đã quá hạn` : "Chưa ai quá hạn",
    blocks: [
      {
        type: "rows",
        groups: [
          {
            rows: rows.slice(0, 8).map((row) => {
              const overdue = row.due && row.due < today ? daysBetween(row.due, today) : 0
              return {
                icon: { kind: "initials", text: row.contact?.initials ?? "?" },
                name: row.contact?.name ?? "Người liên hệ",
                sub: row.due
                  ? `Hạn ${formatShortDate(row.due)}${overdue ? ` · quá hạn ${overdue} ngày` : ""}`
                  : "Không đặt hạn",
                subTone: overdue ? "late" : undefined,
                amount: row.amount,
                amountTone: "plain",
              }
            }),
          },
        ],
      },
    ],
    followUps: [lent ? "Mình đang nợ ai?" : "Ai đang nợ tôi?"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}

/* ---------------------------------------------------------------- accounts */

/** Money into and out of accounts over a period, as each account's card shows it. */
async function answerAccountFlow(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const range = resolvePeriod(plan.period.preset === "all" ? { ...plan.period, preset: "this_month" } : plan.period, today)
  const flows = await sources.flows(range.start, range.end)
  const chosen = plan.accountIds.length
    ? sources.accounts.filter((account) => plan.accountIds.includes(account.id))
    : sources.accounts.filter((account) => account.status === "active")
  const moneyIn = chosen.reduce((sum, account) => sum + (flows[account.id]?.moneyIn ?? 0), 0)
  const moneyOut = chosen.reduce((sum, account) => sum + (flows[account.id]?.moneyOut ?? 0), 0)
  const highest = Math.max(moneyIn, moneyOut, 1)
  const one = chosen.length === 1 ? chosen[0] : undefined
  return {
    kicker: `Tiền vào ra · ${one ? one.name : `${chosen.length} tài khoản`} · ${periodTitle(range, today)}`,
    figure: { amount: moneyIn - moneyOut, tone: moneyIn - moneyOut >= 0 ? "income" : "expense" },
    line: `Vào ${money(moneyIn)}, ra ${money(moneyOut)}, kể cả chuyển khoản và vay nợ`,
    blocks: [
      {
        type: "compare",
        rows: [
          { label: "Tiền vào", amount: moneyIn, share: Math.round((moneyIn / highest) * 100) },
          { label: "Tiền ra", amount: moneyOut, share: Math.round((moneyOut / highest) * 100) },
        ],
      },
      ...(one
        ? []
        : [
            {
              type: "rows" as const,
              groups: [
                {
                  rows: chosen
                    .filter((account) => flows[account.id])
                    .map((account) => {
                      const flow = flows[account.id]
                      return {
                        icon: accountIcon(account),
                        name: account.name,
                        sub: `Vào ${money(flow.moneyIn)} · ra ${money(flow.moneyOut)}`,
                        amount: flow.moneyIn - flow.moneyOut,
                        amountTone: flow.moneyIn - flow.moneyOut >= 0 ? ("income" as const) : ("expense" as const),
                      }
                    }),
                },
              ],
            },
          ]),
    ],
    followUps: one ? [`Số dư ${one.name}`] : ["Số dư các tài khoản"],
    link: { label: "Mở trong Tài khoản", href: "/budget" },
  }
}

/** What the account sheet says: the opening balance, when it was opened, its note; archived ones too. */
async function answerAccountInfo(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const chosen = plan.accountIds.length
    ? sources.accounts.filter((account) => plan.accountIds.includes(account.id))
    : [...sources.accounts].sort((left, right) => Number(left.status === "archived") - Number(right.status === "archived"))
  const opened = (account: Account) => formatShortDate(toDateKey(account.openedAt)) + "/" + toDateKey(account.openedAt).slice(0, 4)
  const link = { label: "Mở trong Tài khoản", href: "/budget" }

  if (chosen.length === 1) {
    const [account] = chosen
    const rows: AnswerRow[] = [
      { icon: accountIcon(account), name: "Số dư ban đầu", sub: `Từ ngày ${opened(account)}`, amount: account.openingBalance, amountTone: "plain" },
      { icon: accountIcon(account), name: "Số dư hiện tại", sub: account.status === "archived" ? "Đã lưu trữ" : "Đang dùng", amount: account.balance, amountTone: account.balance < 0 ? "expense" : "plain" },
    ]
    return {
      kicker: `Tài khoản · ${account.name}`,
      figure: { amount: account.balance, tone: account.balance < 0 ? "expense" : "plain" },
      line: [
        `Mở từ ${opened(account)}`,
        `số dư ban đầu ${money(account.openingBalance)}`,
        account.status === "archived" ? "đã lưu trữ" : null,
        account.note ? `ghi chú: ${account.note}` : null,
      ]
        .filter(Boolean)
        .join(", "),
      blocks: [{ type: "rows", groups: [{ rows }] }],
      followUps: [`Tháng này tiền vào ra ${account.name}`],
      link,
    }
  }

  const archived = chosen.filter((account) => account.status === "archived").length
  return {
    kicker: `Tài khoản · ${chosen.length - archived} đang dùng${archived ? `, ${archived} đã lưu trữ` : ""}`,
    figureText: `${chosen.length} tài khoản`,
    line: archived ? "Tài khoản đã lưu trữ vẫn giữ giao dịch cũ, không dùng cho giao dịch mới." : "Chưa có tài khoản nào được lưu trữ.",
    blocks: [
      {
        type: "rows",
        groups: [
          {
            rows: chosen.slice(0, 10).map((account) => ({
              icon: accountIcon(account),
              name: account.name,
              sub: `${account.status === "archived" ? "Đã lưu trữ · " : ""}Mở từ ${opened(account)}`,
              subTone: undefined,
              amount: account.balance,
              amountTone: account.balance < 0 ? ("expense" as const) : ("plain" as const),
            })),
          },
        ],
      },
    ],
    followUps: ["Tổng số dư các tài khoản"],
    link,
  }
}

/* ------------------------------------------------------------------- debts */

const directionName = (lent: boolean) => (lent ? "Cho vay" : "Đi vay")

/** Both ways at once: what is to come in and what is to go out, as the debts page heads it. */
async function answerDebtsBoth(sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const open = (await sources.debts()).filter((debt) => debt.status !== "settled")
  const side = (direction: "lent" | "borrowed") => {
    const debts = open.filter((debt) => debt.direction === direction)
    const remaining = debts.reduce((sum, debt) => sum + getPaymentMetrics(debt, today).remainingAmount, 0)
    return { remaining, people: new Set(debts.filter((debt) => getPaymentMetrics(debt, today).remainingAmount > 0).map((debt) => debt.contactId)).size }
  }
  const lent = side("lent")
  const borrowed = side("borrowed")
  const net = lent.remaining - borrowed.remaining
  return {
    kicker: "Cần thu và cần trả",
    figure: { amount: net, tone: net >= 0 ? "income" : "expense" },
    line: net >= 0 ? `Cần thu nhiều hơn cần trả ${money(net)}` : `Cần trả nhiều hơn cần thu ${money(-net)}`,
    blocks: [
      {
        type: "rows",
        groups: [
          {
            rows: [
              { icon: { kind: "initials", text: "+" }, name: "Cần thu", sub: `${lent.people} người đang nợ bạn`, amount: lent.remaining, amountTone: "income" },
              { icon: { kind: "initials", text: "−" }, name: "Cần trả", sub: `Bạn nợ ${borrowed.people} người`, amount: -borrowed.remaining, amountTone: "expense" },
            ],
          },
        ],
      },
    ],
    followUps: ["Ai đang nợ tôi?", "Mình đang nợ ai?", "Khoản nào sắp đến hạn?"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}

/** What falls due within two weeks or is past due, both ways, the nearest first. */
async function answerDebtsDue(sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const contacts = new Map(sources.contacts.map((contact) => [contact.id, contact]))
  const horizon = addDays(today, 14)
  const due = (await sources.debts())
    .filter((debt) => debt.status !== "settled" && debt.dueAt && debt.dueAt <= horizon)
    .map((debt) => ({ debt, remaining: getPaymentMetrics(debt, today).remainingAmount }))
    .filter((item) => item.remaining > 0)
    .sort((left, right) => left.debt.dueAt!.localeCompare(right.debt.dueAt!))
  const late = due.filter((item) => item.debt.dueAt! < today).length
  return {
    kicker: "Sắp đến hạn · 14 ngày tới",
    figureText: due.length ? `${due.length} khoản` : "Không có khoản nào",
    line: due.length ? (late ? `${late} khoản đã quá hạn` : "Chưa khoản nào quá hạn") : "Không có khoản nợ nào đến hạn trong 14 ngày tới.",
    blocks: due.length
      ? [
          {
            type: "rows",
            groups: [
              {
                rows: due.slice(0, 8).map(({ debt, remaining }) => {
                  const lent = debt.direction === "lent"
                  const days = daysBetween(today, debt.dueAt!)
                  const contact = contacts.get(debt.contactId)
                  return {
                    icon: { kind: "initials", text: contact?.initials ?? "?" } as AnswerIcon,
                    name: contact?.name ?? "Người liên hệ",
                    sub: `${directionName(lent)} · hạn ${formatShortDate(debt.dueAt!)} · ${days < 0 ? `quá hạn ${-days} ngày` : days === 0 ? "hôm nay" : `còn ${days} ngày`}`,
                    subTone: days < 0 ? ("late" as const) : undefined,
                    amount: lent ? remaining : -remaining,
                    amountTone: lent ? ("income" as const) : ("expense" as const),
                  }
                }),
              },
            ],
          },
        ]
      : [],
    followUps: ["Tổng cần thu và cần trả"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}

/** Debts paid off, one way or both, the latest first. */
async function answerSettledDebts(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const both = plan.measure === "debts"
  const lent = plan.measure === "lent"
  const contacts = new Map(sources.contacts.map((contact) => [contact.id, contact]))
  const settled = (await sources.debts()).filter(
    (debt) =>
      (both || debt.direction === (lent ? "lent" : "borrowed")) &&
      debt.status === "settled" &&
      (plan.contactIds.length === 0 || plan.contactIds.includes(debt.contactId)),
  )
  // "Lan Anh đã trả được bao nhiêu" read as paid off: her open debt answers it.
  if (settled.length === 0 && plan.contactIds.length === 1 && !both) {
    return answerDebts({ ...plan, debtStatus: "open" }, sources)
  }
  return {
    kicker: `${both ? "Vay nợ" : directionName(lent)} · đã trả xong`,
    figureText: `${settled.length} khoản`,
    line: settled.length ? `Tổng ${money(settled.reduce((sum, debt) => sum + debt.amount, 0))} tiền gốc` : "Chưa có khoản nào trả xong.",
    blocks: settled.length
      ? [
          {
            type: "rows",
            groups: [
              {
                rows: settled.slice(0, 8).map((debt) => {
                  const contact = contacts.get(debt.contactId)
                  const last = [...(debt.payments ?? [])].sort((left, right) => right.paidAt.localeCompare(left.paidAt))[0]
                  return {
                    icon: { kind: "initials", text: contact?.initials ?? "?" } as AnswerIcon,
                    name: contact?.name ?? "Người liên hệ",
                    sub: `${both ? `${directionName(debt.direction === "lent")} · ` : ""}Ghi ${formatShortDate(debt.recordedAt)}${last ? ` · trả xong ${formatShortDate(last.paidAt)}` : ""}`,
                    amount: debt.amount,
                    amountTone: "plain" as const,
                  }
                }),
              },
            ],
          },
        ]
      : [],
    followUps: [both || lent ? "Ai đang nợ tôi?" : "Mình đang nợ ai?"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}

/** Repayments over a period: money back from loans made (collected), or paid back on loans taken (repaid). */
async function answerRepayments(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const collected = plan.measure === "collected"
  const range = resolvePeriod(plan.period.preset === "all" && plan.contactIds.length === 0 ? { ...plan.period, preset: "this_month" } : plan.period, today)
  const debts = new Map((await sources.debts()).map((debt) => [debt.id, debt]))
  const payments = (await sources.debtPayments(range.start, range.end))
    .filter((payment) => payment.kind === (collected ? "income" : "expense"))
    .filter((payment) => plan.contactIds.length === 0 || plan.contactIds.includes(debts.get(payment.debtId ?? "")?.contactId ?? ""))
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
  const total = payments.reduce((sum, payment) => sum + Math.abs(payment.amount), 0)
  const look = lookups(sources)
  return {
    kicker: `${collected ? "Thu nợ" : "Trả nợ"} · ${periodTitle(range, today)}`,
    figure: { amount: collected ? total : -total, tone: collected ? "income" : "plain" },
    line: payments.length ? `${payments.length} lần ${collected ? "nhận" : "trả"}` : `Chưa có lần ${collected ? "thu nợ" : "trả nợ"} nào.`,
    blocks: payments.length
      ? [
          {
            type: "rows",
            groups: [
              {
                rows: payments.slice(0, 6).map((payment) => ({
                  icon: accountIcon(look.account(payment.accountId)),
                  name: payment.title,
                  sub: `${formatShortDate(toDateKey(payment.occurredAt))} · ${payment.accountName ?? ""}`,
                  amount: payment.amount,
                  amountTone: collected ? ("income" as const) : ("expense" as const),
                })),
              },
            ],
          },
        ]
      : [],
    followUps: [collected ? "Ai còn nợ tôi?" : "Mình còn nợ ai?"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}

/** Loans made or taken over a period, by when they were written down. */
async function answerNewDebts(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const lent = plan.measure === "new_lent"
  const range = resolvePeriod(plan.period.preset === "all" ? { ...plan.period, preset: "this_month" } : plan.period, today)
  const contacts = new Map(sources.contacts.map((contact) => [contact.id, contact]))
  const debts = (await sources.debts())
    .filter((debt) => debt.direction === (lent ? "lent" : "borrowed") && debt.recordedAt >= range.start && debt.recordedAt < range.end)
    .filter((debt) => plan.contactIds.length === 0 || plan.contactIds.includes(debt.contactId))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
  const total = debts.reduce((sum, debt) => sum + debt.amount, 0)
  return {
    kicker: `${directionName(lent)} mới · ${periodTitle(range, today)}`,
    figure: { amount: total, tone: "plain" },
    line: debts.length ? `${debts.length} khoản` : "Chưa có khoản nào.",
    blocks: debts.length
      ? [
          {
            type: "rows",
            groups: [
              {
                rows: debts.slice(0, 6).map((debt) => {
                  const contact = contacts.get(debt.contactId)
                  return {
                    icon: { kind: "initials", text: contact?.initials ?? "?" } as AnswerIcon,
                    name: contact?.name ?? "Người liên hệ",
                    sub: `Ghi ${formatShortDate(debt.recordedAt)}${debt.dueAt ? ` · hạn ${formatShortDate(debt.dueAt)}` : ""}`,
                    amount: debt.amount,
                    amountTone: "plain" as const,
                  }
                }),
              },
            ],
          },
        ]
      : [],
    followUps: [lent ? "Ai đang nợ tôi?" : "Mình đang nợ ai?"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}

/**
 * One person's open debts in full, as the debt's panel shows them: the
 * principal, the interest so far, what has been paid, what is left, the due
 * date, and the payments made. Null when they have none open that way.
 */
async function answerDebtDetail(plan: QuestionPlan, sources: AnswerSources): Promise<Answer | null> {
  const { today } = sources
  const lent = plan.measure === "lent"
  const contact = sources.contacts.find((item) => item.id === plan.contactIds[0])
  const debts = (await sources.debts()).filter(
    (debt) => debt.contactId === plan.contactIds[0] && debt.direction === (lent ? "lent" : "borrowed") && debt.status !== "settled",
  )
  if (!contact || debts.length === 0) return null
  const metrics = debts.map((debt) => ({ debt, ...getPaymentMetrics(debt, today) }))
  const sum = (pick: (item: (typeof metrics)[number]) => number) => metrics.reduce((total, item) => total + pick(item), 0)
  const principal = sum((item) => item.debt.amount)
  const interest = sum((item) => item.interestAmount)
  const paid = sum((item) => item.paidAmount)
  const remaining = sum((item) => item.remainingAmount)
  const nearestDue = debts.map((debt) => debt.dueAt).filter((due): due is string => Boolean(due)).sort()[0]
  const payments = debts
    .flatMap((debt) => debt.payments ?? [])
    .sort((left, right) => right.paidAt.localeCompare(left.paidAt))
  const overdue = nearestDue && nearestDue < today ? daysBetween(nearestDue, today) : 0
  const figureRows: AnswerRow[] = [
    { icon: { kind: "initials", text: contact.initials }, name: "Tiền gốc", sub: `${debts.length} khoản · ghi từ ${formatShortDate(debts.map((debt) => debt.recordedAt).sort()[0])}`, amount: principal, amountTone: "plain" },
    ...(interest ? [{ icon: { kind: "initials", text: "%" } as AnswerIcon, name: "Lãi đến hôm nay", amount: interest, amountTone: "plain" as const }] : []),
    { icon: { kind: "initials", text: "✓" }, name: lent ? "Đã nhận lại" : "Đã trả", sub: `${payments.length} lần`, amount: paid, amountTone: "plain" },
  ]
  return {
    kicker: lent ? `${contact.name} đang nợ bạn` : `Bạn đang nợ ${contact.name}`,
    figure: { amount: remaining, tone: lent ? "income" : "plain" },
    line: [
      `${lent ? "Đã nhận lại" : "Đã trả"} ${money(paid)} trên ${money(principal + interest)}`,
      nearestDue ? `hạn ${formatShortDate(nearestDue)}${overdue ? `, quá hạn ${overdue} ngày` : ""}` : "không đặt hạn",
      interest ? `lãi đến hôm nay ${money(interest)}` : debts.some((debt) => debt.hasInterest) ? "chưa phát sinh lãi" : "không tính lãi",
    ].join(", "),
    blocks: [
      { type: "rows", groups: [{ rows: figureRows }] },
      ...(payments.length
        ? [
            {
              type: "rows" as const,
              groups: [
                {
                  heading: lent ? "Các lần nhận lại" : "Các lần trả",
                  rows: payments.slice(0, 5).map((payment) => ({
                    icon: accountIcon(sources.accounts.find((account) => account.id === payment.accountId)),
                    name: formatShortDate(payment.paidAt) + "/" + payment.paidAt.slice(0, 4),
                    sub: payment.accountName ?? payment.note ?? undefined,
                    amount: payment.amount,
                    amountTone: lent ? ("income" as const) : ("expense" as const),
                  })),
                },
              ],
            },
          ]
        : []),
    ],
    followUps: [lent ? "Ai đang nợ tôi?" : "Mình đang nợ ai?"],
    link: { label: "Mở trong Vay nợ", href: "/debts" },
  }
}
