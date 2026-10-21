import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
import { getBudgetOverview } from "@/lib/budgets/repository"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { getPurchaseDraft } from "@/lib/plans/purchase-draft"
import { getDebtPaymentsInRange, getTransactionsInRange } from "@/lib/transactions/repository"

import { getTransactionDateKey, getTransactionMonthKey, getTransactionMonthRange } from "./get-transaction-period"

export type TransactionsSearchParams = {
  month?: string
  account?: string
  /** Category group ids, comma-separated: start filtered to them (from a spending limit). */
  group?: string
  /** "1": opens the add-transaction sheet, e.g. from the daily reminder. */
  add?: string
  order?: string
  grant?: string
  /** "debts": the page opens on Vay nợ (2026-10-21, the debts page merged in). */
  view?: string
  /** A debt to open on Vay nợ (from a notice, the overview, a transaction). */
  debt?: string
}

/**
 * Everything the transactions page shows, for the month in the address (this
 * month by default), and its Vay nợ view: the people and debts, each with its
 * payments, so switching to it shows at once (2026-10-21).
 */
export async function loadTransactions({ month, account, group, add, order, grant, view, debt }: TransactionsSearchParams) {
  const todayDateKey = getTransactionDateKey(new Date())
  const selectedMonth = getTransactionMonthKey(month, todayDateKey)
  const range = getTransactionMonthRange(selectedMonth, 1)
  const {
    data: [transactions, accounts, categoryGroups, purchaseDraft, budgets, contacts, debts],
  } = await loadWithSession("transactions", (user) =>
    Promise.all([
      // Loans and their repayments are listed too, so every change to a
      // balance shows here; they are edited on the debts page.
      Promise.all([
        getTransactionsInRange(user.uid, range.start, range.end),
        getDebtPaymentsInRange(user.uid, range.start, range.end),
      ]).then(([own, repayments]) =>
        [...own, ...repayments].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
      ),
      getAccounts(user.uid),
      getCategoryGroups(user.uid),
      // A Pro purchase to write down: the buyer's expense, or an admin's income.
      order || grant ? getPurchaseDraft(user, { order, grant }) : undefined,
      // This month's limits, whichever month is shown: the line under the figures and the spending form's hint.
      getBudgetOverview(user.uid, todayDateKey),
      getContacts(user.uid),
      getDebts(user.uid),
    ]),
  )

  return {
    accounts,
    // Opened from an account's sheet: start filtered to that account.
    initialAccountId: accounts.some((item) => item.id === account) ? account : undefined,
    // Opened from a spending limit: start filtered to its groups.
    initialGroupIds: (group ?? "").split(",").filter((id) => categoryGroups.some((item) => item.id === id)),
    categoryGroups,
    selectedMonth,
    todayDateKey,
    transactions,
    initialAddOpen: add === "1",
    purchaseDraft,
    budgets,
    contacts,
    debts,
    // A debt named in the address opens Vay nợ on it.
    view: view === "debts" || debt ? ("debts" as const) : ("transactions" as const),
    requestedDebtId: debts.some((item) => item.id === debt) ? debt : undefined,
  }
}
