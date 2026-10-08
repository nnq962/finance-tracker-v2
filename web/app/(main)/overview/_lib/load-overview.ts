import "server-only"

import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { todayDate } from "@/lib/debts/calculations"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { summarizeAllocation, summarizeDays } from "@/lib/overview/month-data"
import { getOverviewSummary } from "@/lib/overview/summary"
import { getMissionState } from "@/lib/onboarding/repository"
import { checkReturningPayment, getPayOS } from "@/lib/plans/payos"
import { getPlanState } from "@/lib/plans/repository"
import { getTransactionsInRange } from "@/lib/transactions/repository"

function monthKey(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex, 1))

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function getOverviewTransactionRange(today: string) {
  const [year, month] = today.split("-").map(Number)
  const startMonth = monthKey(year, month - 6)
  const endMonth = monthKey(year, month)

  return {
    startMonth,
    start: new Date(`${startMonth}-01T00:00:00+07:00`),
    end: new Date(`${endMonth}-01T00:00:00+07:00`),
  }
}

/** Everything the overview shows, for the signed-in user. */
export async function loadOverview(order?: string) {
  const today = todayDate()
  const transactionRange = getOverviewTransactionRange(today)
  const {
    user,
    data: [accounts, debts, contacts, transactions, categoryGroups, missions, planState, paymentOutcome],
  } = await loadWithSession(async (user) => {
    // Back from payOS: settled first, so the plan read next already shows it.
    const paymentOutcome = await checkReturningPayment(user.uid, order)
    return Promise.all([
      getAccounts(user.uid),
      getDebts(user.uid),
      getContacts(user.uid),
      getTransactionsInRange(user.uid, transactionRange.start, transactionRange.end),
      getCategoryGroups(user.uid),
      getMissionState(user.uid),
      getPlanState(user.uid),
      paymentOutcome,
    ])
  })

  return {
    user,
    today,
    accounts,
    contacts,
    categoryGroups,
    missions,
    planState,
    paymentOutcome,
    checkoutEnabled: getPayOS() !== null,
    summary: getOverviewSummary(accounts, debts, contacts, transactions, today),
    // Totals only: the page does not send six months of transactions.
    days: summarizeDays(transactions),
    allocation: summarizeAllocation(transactions),
    // The six months loaded for the chart.
    minMonth: transactionRange.startMonth,
  }
}

export type OverviewData = Awaited<ReturnType<typeof loadOverview>>
