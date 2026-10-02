import type { Account } from "@/lib/accounts/types"
import { getPaymentMetrics } from "@/lib/debts/calculations"
import type { Contact, Debt } from "@/lib/debts/types"
import type { Transaction } from "@/lib/transactions/types"

const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})

function dateKey(value: string) {
  const parts = vietnamDateFormatter.formatToParts(new Date(value))
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function monthKeys(today: string) {
  const [year, month] = today.split("-").map(Number)
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 6 + index, 1))
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
    return { key, label: `T${date.getUTCMonth() + 1}` }
  })
}

export function getOverviewSummary(
  accounts: Account[],
  debts: Debt[],
  contacts: Contact[],
  transactions: Transaction[],
  today: string,
) {
  const cash = accounts.reduce((total, account) => total + account.balance, 0)
  const archivedCash = accounts
    .filter((account) => account.status === "archived")
    .reduce((total, account) => total + account.balance, 0)
  const debtBalances = debts.reduce(
    (totals, debt) => {
      const remaining = getPaymentMetrics(debt, today).remainingAmount
      if (debt.direction === "lent") totals.receivable += remaining
      else totals.payable += remaining
      return totals
    },
    { receivable: 0, payable: 0 },
  )

  const months = monthKeys(today).map((month) => ({ ...month, income: 0, expense: 0 }))
  const monthByKey = new Map(months.map((month) => [month.key, month]))
  const currentMonth = today.slice(0, 7)
  const spendingByGroup = new Map<string, { id: string; name: string; amount: number }>()

  for (const transaction of transactions) {
    if (transaction.source || transaction.kind === "transfer") continue
    const month = dateKey(transaction.occurredAt).slice(0, 7)
    const bucket = monthByKey.get(month)
    if (!bucket) continue

    if (transaction.kind === "income") {
      bucket.income += Math.abs(transaction.amount)
    } else {
      const amount = Math.abs(transaction.amount)
      bucket.expense += amount
      if (month === currentMonth) {
        const id = transaction.categoryGroupId ?? "other"
        const existing = spendingByGroup.get(id)
        spendingByGroup.set(id, {
          id,
          name: transaction.categoryGroupName ?? "Chưa phân loại",
          amount: (existing?.amount ?? 0) + amount,
        })
      }
    }
  }

  const contactsById = new Map(contacts.map((contact) => [contact.id, contact.name]))
  const dueDebts = debts
    .filter((debt) => debt.dueAt && getPaymentMetrics(debt, today).remainingAmount > 0)
    .map((debt) => ({
      id: debt.id,
      contactName: contactsById.get(debt.contactId) ?? "Người liên hệ",
      direction: debt.direction,
      dueAt: debt.dueAt!,
      daysUntilDue: Math.round((Date.parse(debt.dueAt!) - Date.parse(today)) / 86_400_000),
      remainingAmount: getPaymentMetrics(debt, today).remainingAmount,
    }))
    .filter((debt) => debt.daysUntilDue <= 14)
    .sort((left, right) => left.daysUntilDue - right.daysUntilDue || right.remainingAmount - left.remainingAmount)
    .slice(0, 4)

  return {
    netWorth: { cash, archivedCash, ...debtBalances, total: cash + debtBalances.receivable - debtBalances.payable },
    cashFlow: {
      months,
      current: months.find((month) => month.key === currentMonth) ?? { income: 0, expense: 0 },
      hasActivity: months.some((month) => month.income > 0 || month.expense > 0),
    },
    spending: [...spendingByGroup.values()].sort((left, right) => right.amount - left.amount),
    dueDebts,
    recentTransactions: [...transactions]
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, 5),
    monthLabel: `Tháng ${Number(today.slice(5, 7))}/${today.slice(0, 4)}`,
  }
}

export type OverviewSummary = ReturnType<typeof getOverviewSummary>
