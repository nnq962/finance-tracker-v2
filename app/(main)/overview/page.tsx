import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { todayDate } from "@/lib/debts/calculations"
import { getContacts, getDebtSummaries } from "@/lib/debts/repository"
import { getOverviewSummary } from "@/lib/overview/summary"
import { getTransactionsInRange } from "@/lib/transactions/repository"

import {
  CashFlow,
  DueDebts,
  NetWorth,
  RecentTransactions,
  Spending,
} from "./_components/overview-sections"

function monthKey(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex, 1))

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function getOverviewTransactionRange(today: string) {
  const [year, month] = today.split("-").map(Number)
  const startMonth = monthKey(year, month - 6)
  const endMonth = monthKey(year, month)

  return {
    start: new Date(`${startMonth}-01T00:00:00+07:00`),
    end: new Date(`${endMonth}-01T00:00:00+07:00`),
  }
}

export default async function OverviewPage() {
  const user = await requireSession()
  const today = todayDate()
  const transactionRange = getOverviewTransactionRange(today)
  const [accounts, debts, contacts, transactions, categoryGroups] = await Promise.all([
    getAccounts(user.uid),
    getDebtSummaries(user.uid),
    getContacts(user.uid),
    getTransactionsInRange(
      user.uid,
      transactionRange.start,
      transactionRange.end,
    ),
    getCategoryGroups(user.uid),
  ])
  const summary = getOverviewSummary(
    accounts,
    debts,
    contacts,
    transactions,
    today,
  )

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12 md:space-y-8">
      <header className="space-y-1.5 pt-1">
        <h1 className="text-3xl font-semibold tracking-tight">Tổng quan</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Tài sản, thu chi và các khoản cần theo dõi.
        </p>
      </header>
      <NetWorth data={summary.netWorth} />
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <CashFlow summary={summary} />
        <Spending categoryGroups={categoryGroups} summary={summary} />
        <DueDebts debts={summary.dueDebts} />
        <RecentTransactions transactions={summary.recentTransactions} />
      </div>
    </main>
  )
}
