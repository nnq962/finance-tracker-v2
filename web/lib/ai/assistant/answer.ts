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

import type { Answer, AnswerBlock, AnswerIcon, AnswerRow, QuestionPlan } from "./types"

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
  return category ? { kind: "category", icon: category.icon, color: category.color } : { kind: "account" }
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

/** Shares of a whole as bars, the largest few and the rest together. */
function barsBlock(entries: { icon: AnswerIcon; name: string; amount: number }[], most: number): AnswerBlock | null {
  const sorted = entries.filter((entry) => entry.amount > 0).sort((left, right) => right.amount - left.amount)
  if (sorted.length < 2) return null
  const total = sorted.reduce((sum, entry) => sum + entry.amount, 0)
  const shown = sorted.length > most ? sorted.slice(0, most - 1) : sorted
  const rest = sorted.slice(shown.length)
  const rows = [
    ...shown,
    ...(rest.length
      ? [{ icon: { kind: "account" } as AnswerIcon, name: `Khác (${rest.length} mục)`, amount: rest.reduce((sum, entry) => sum + entry.amount, 0) }]
      : []),
  ].map((entry) => ({ ...entry, share: Math.max(2, Math.round((entry.amount / total) * 100)) }))
  return { type: "bars", rows }
}

/* ------------------------------------------------------------ the answers */

const measureNames = { spending: "Chi tiêu", income: "Thu nhập", net: "Thu chi", transactions: "Giao dịch" } as const

/** Works out the answer to a plan; every figure comes from the user's records here. */
export async function answerQuestion(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  if (plan.measure === "balance") return answerBalance(plan, sources)
  if (plan.measure === "lent" || plan.measure === "borrowed") return answerDebts(plan, sources)
  return answerFlow(plan, sources)
}

async function answerFlow(plan: QuestionPlan, sources: AnswerSources): Promise<Answer> {
  const { today } = sources
  const look = lookups(sources)
  const measure = plan.measure as "spending" | "income" | "net" | "transactions"
  const range = resolvePeriod(plan.period, today)
  const before = measure === "transactions" ? null : comparedRange(range, plan.compare, today)

  const groupIds = new Set(plan.groupIds)
  const categoryIds = new Set(plan.categoryIds)
  const accountIds = new Set(plan.accountIds)
  const search = fold(plan.search)
  const kinds = measure === "spending" ? ["expense"] : measure === "income" ? ["income"] : measure === "net" ? ["expense", "income"] : ["expense", "income", "transfer"]
  const keep = (transaction: Transaction) =>
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
    rows.filter((row) => !kind || row.kind === kind).reduce((total, row) => total + Math.abs(row.amount), 0)
  const value = (rows: Transaction[]) => (measure === "net" ? sum(rows, "income") - sum(rows, "expense") : sum(rows))

  // What the answer is about: the categories asked for, a word searched, or the measure.
  const names = [
    ...plan.groupIds.map((id) => look.group(id)?.name),
    ...plan.categoryIds.map((id) => look.category(id)?.name),
  ].filter(Boolean)
  const accountNames = plan.accountIds.map((id) => look.account(id)?.name).filter(Boolean)
  const subject = names.length ? names.join(", ") : search ? `“${plan.search}”` : measureNames[measure]
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
              ? { icon: { kind: "account" } as AnswerIcon, name: row.accountName ?? "Tài khoản", amount: 0 }
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
    const sorted = [...current].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount)).slice(0, limit)
    const first = sorted[0]
    return {
      kicker: `${measure === "income" ? "Khoản thu" : measure === "spending" ? "Khoản chi" : "Giao dịch"} lớn nhất · ${subject === measureNames[measure] ? "" : `${subject} · `}${periodTitle(range, today)}`,
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
      followUps: [measure === "income" ? "Thu từ đâu nhiều nhất?" : "Tiêu vào đâu nhiều nhất?"],
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
                icon: { kind: "account" },
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
