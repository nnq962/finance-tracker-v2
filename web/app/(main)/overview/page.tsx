import { Page, PageHeader } from "@/components/page"
import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { todayDate } from "@/lib/debts/calculations"
import { getContacts, getDebtSummaries } from "@/lib/debts/repository"
import { getOverviewSummary } from "@/lib/overview/summary"
import { getTransactionsInRange } from "@/lib/transactions/repository"

import { OverviewMonth } from "./_components/overview-month"
import {
  CashFlowTrend,
  DueDebts,
  NetWorth,
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
    startMonth,
    start: new Date(`${startMonth}-01T00:00:00+07:00`),
    end: new Date(`${endMonth}-01T00:00:00+07:00`),
  }
}

export default async function OverviewPage() {
  const today = todayDate()
  const transactionRange = getOverviewTransactionRange(today)
  const {
    data: [accounts, debts, contacts, transactions, categoryGroups],
  } = await loadWithSession((user) =>
    Promise.all([
      getAccounts(user.uid),
      getDebtSummaries(user.uid),
      getContacts(user.uid),
      getTransactionsInRange(
        user.uid,
        transactionRange.start,
        transactionRange.end,
      ),
      getCategoryGroups(user.uid),
    ]),
  )
  const summary = getOverviewSummary(
    accounts,
    debts,
    contacts,
    transactions,
    today,
  )

  return (
    <Page>
      <PageHeader
        title="Tổng quan"
      />
      <NetWorth data={summary.netWorth} />
      <OverviewMonth
        accounts={accounts}
        categoryGroups={categoryGroups}
        transactions={transactions}
        today={today}
        // The six months loaded for the chart.
        minMonth={transactionRange.startMonth}
        aside={<DueDebts debts={summary.dueDebts} />}
        footer={<CashFlowTrend summary={summary} />}
      />
    </Page>
  )
}
