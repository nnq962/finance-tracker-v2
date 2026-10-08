import type { Account } from "@/lib/accounts/types"
import { getPaymentMetrics } from "@/lib/debts/calculations"
import type { Contact, Debt } from "@/lib/debts/types"
import type { Transaction } from "@/lib/transactions/types"

import { toDateKey as dateKey } from "@/lib/format-date"

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

  for (const transaction of transactions) {
    if (transaction.source || transaction.kind === "transfer") continue
    const month = dateKey(transaction.occurredAt).slice(0, 7)
    const bucket = monthByKey.get(month)
    if (!bucket) continue

    if (transaction.kind === "income") {
      bucket.income += Math.abs(transaction.amount)
    } else {
      bucket.expense += Math.abs(transaction.amount)
    }
  }

  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]))
  const dueDebts = debts
    .filter((debt) => debt.dueAt && getPaymentMetrics(debt, today).remainingAmount > 0)
    .map((debt) => ({
      id: debt.id,
      contactId: debt.contactId,
      contactName: contactsById.get(debt.contactId)?.name ?? "Người liên hệ",
      contactInitials: contactsById.get(debt.contactId)?.initials ?? "?",
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
    dueDebts,
  }
}

export type OverviewSummary = ReturnType<typeof getOverviewSummary>
