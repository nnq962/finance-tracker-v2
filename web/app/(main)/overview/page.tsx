import { Page, PageHeader } from "@/components/page"
import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"
import { getCategoryGroups } from "@/lib/categories/repository"
import { todayDate } from "@/lib/debts/calculations"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { summarizeAllocation, summarizeDays } from "@/lib/overview/month-data"
import { getOverviewSummary } from "@/lib/overview/summary"
import { getChecklistState } from "@/lib/onboarding/repository"
import { getTransactionsInRange } from "@/lib/transactions/repository"

import { GettingStarted } from "./_components/getting-started"

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
    data: [accounts, debts, contacts, transactions, categoryGroups, checklist],
  } = await loadWithSession((user) =>
    Promise.all([
      getAccounts(user.uid),
      getDebts(user.uid),
      getContacts(user.uid),
      getTransactionsInRange(
        user.uid,
        transactionRange.start,
        transactionRange.end,
      ),
      getCategoryGroups(user.uid),
      getChecklistState(user.uid),
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
      <GettingStarted state={checklist} accounts={accounts} categoryGroups={categoryGroups} />
      <OverviewMonth
        accounts={accounts}
        categoryGroups={categoryGroups}
        // Totals only: the page no longer sends six months of transactions.
        days={summarizeDays(transactions)}
        allocation={summarizeAllocation(transactions)}
        today={today}
        // The six months loaded for the chart.
        minMonth={transactionRange.startMonth}
        netWorth={<NetWorth data={summary.netWorth} />}
        dueDebts={
          summary.dueDebts.length > 0 ? <DueDebts debts={summary.dueDebts} /> : undefined
        }
        trend={<CashFlowTrend summary={summary} />}
      />
    </Page>
  )
}
