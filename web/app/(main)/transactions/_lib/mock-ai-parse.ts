import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup, CategoryItem } from "@/lib/categories/types"

import type { TransactionKind } from "../_types/transaction"

/** A transaction as the assistant understood it; any part may still be missing. */
export type AiTransactionDraft = {
  kind: TransactionKind
  amount: number | null
  title: string
  categoryId?: string
  accountId?: string
  /** The receiving account of a transfer. */
  toAccountId?: string
  /** "YYYY-MM-DD" */
  date: string
}

/** Lower case without Vietnamese marks, so "Ăn trưa" matches "an trua". */
export function normalize(text: string) {
  return text
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
}

const units: [RegExp, number][] = [
  [/^(trieu|tr|cu|m)$/, 1_000_000],
  [/^(nghin|ngan|k|ng)$/, 1_000],
]

/**
 * The amount said, e.g. "45k", "1,5 triệu", "50.000": the first number with a
 * unit, else the largest ("2 ly cà phê 90000" is 90,000, not 2).
 */
function parseAmount(text: string) {
  const amounts = [...text.matchAll(/(\d+(?:[.,]\d+)*)\s*(trieu|tr|cu|nghin|ngan|ng|k|m)?\b/g)]
    .map(([, digits, unit]) => {
      const multiplier = units.find(([pattern]) => unit && pattern.test(unit))?.[1] ?? 1
      // "50.000" groups thousands; "1,5" or "1.5" before a unit is a fraction.
      const value = multiplier > 1
        ? Number(digits.replace(",", "."))
        : Number(digits.replace(/[.,]/g, ""))
      return { amount: Math.round(value * multiplier), hasUnit: multiplier > 1 }
    })
    .filter(({ amount }) => Number.isFinite(amount) && amount > 0)

  return amounts.find(({ hasUnit }) => hasUnit)?.amount
    ?? Math.max(...amounts.map(({ amount }) => amount), 0)
}

function parseKind(text: string): TransactionKind {
  if (/\b(chuyen|nap tien vao|rut tien)\b/.test(text)) return "transfer"
  if (/\b(luong|thuong|duoc cho|nhan|thu ve|hoan tien|lai)\b/.test(text)) return "income"
  return "expense"
}

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function parseDate(text: string, today: string) {
  if (/\bhom kia\b/.test(text)) return shiftDate(today, -2)
  if (/\b(hom qua|toi qua|sang qua)\b/.test(text)) return shiftDate(today, -1)
  return today
}

function findCategory(text: string, groups: CategoryGroup[], kind: TransactionKind) {
  if (kind === "transfer") return undefined
  const ofKind = groups.filter((group) => group.type === kind)
  const items = ofKind.flatMap((group) => group.items)
  const byItem = items.find((item) => text.includes(normalize(item.name)))
  if (byItem) return byItem
  const group = ofKind.find((item) => text.includes(normalize(item.name)))
  return group?.items[0] as CategoryItem | undefined
}

/** Accounts named in the request, in the order they were said. */
function findAccounts(text: string, accounts: Account[]) {
  return accounts
    .filter((account) => account.status === "active")
    .map((account) => {
      const names = [account.name, account.institutionName]
        .filter(Boolean)
        .map((name) => normalize(name!))
      const index = Math.min(...names.map((name) => {
        const at = text.indexOf(name)
        return at === -1 ? Infinity : at
      }))
      return { account, index }
    })
    .filter(({ index }) => index !== Infinity)
    .sort((left, right) => left.index - right.index)
    .map(({ account }) => account)
}

/** The request without the amount and the day, as the transaction's title. */
function parseTitle(original: string) {
  const title = original
    .replace(/(\d+(?:[.,]\d+)*)\s*(triệu|tr|củ|nghìn|ngàn|ng|k|m|đ|đồng|vnd)?/gi, "")
    .replace(/\b(hôm nay|hôm qua|hôm kia|tối qua|sáng qua)\b/gi, "")
    .replace(/\b(bằng|qua|từ|vào|sang)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
  return title ? title[0].toLocaleUpperCase("vi-VN") + title.slice(1) : ""
}

/**
 * Stands in for the assistant until the server is connected: picks the
 * amount, day, kind, category and accounts out of the request by simple
 * rules, after a short pause like a real round trip.
 */
export async function mockParseTransaction(
  request: string,
  context: { accounts: Account[]; categoryGroups: CategoryGroup[]; today: string },
): Promise<AiTransactionDraft> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  const text = normalize(request)
  const kind = parseKind(text)
  const named = findAccounts(text, context.accounts)
  const fallback = context.accounts.find((account) => account.status === "active")
  const category = findCategory(text, context.categoryGroups, kind)

  return {
    kind,
    amount: parseAmount(text) || null,
    title: parseTitle(request) || category?.name || "",
    categoryId: category?.id,
    accountId: (named[0] ?? fallback)?.id,
    toAccountId: kind === "transfer" ? named[1]?.id : undefined,
    date: parseDate(text, context.today),
  }
}
