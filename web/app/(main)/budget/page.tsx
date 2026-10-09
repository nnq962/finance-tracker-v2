import { Page, PageHeader } from "@/components/page"
import { FloatingActions } from "@/components/app/floating-actions"
import { loadWithSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"
import { getCategoryGroups } from "@/lib/categories/repository"
import { toDateKey } from "@/lib/format-date"
import { getAccountFlows, getRecentTransactionsByAccount } from "@/lib/transactions/repository"

import { AccountList } from "./_components/account-list"
import { AddAccountButton } from "./_components/add-account-button"
import { BalanceHero } from "./_components/balance-hero"
import { BudgetLayout } from "./_components/budget-layout"

/** This month in Vietnam time, from its first day to the next month's. */
function currentMonth() {
  const [year, month] = toDateKey(new Date()).split("-").map(Number)
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`
  return {
    label: `Tháng ${month}`,
    start: new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+07:00`),
    end: new Date(`${next}-01T00:00:00+07:00`),
  }
}

export default async function AccountsPage() {
  const month = currentMonth()
  const { data: [accounts, recentTransactions, flows, categoryGroups] } = await loadWithSession((user) =>
    Promise.all([
      getAccounts(user.uid),
      // A few per account, shown when its sheet opens without another round trip.
      getRecentTransactionsByAccount(user.uid),
      // What each account took in and paid out this month, for its sheet.
      getAccountFlows(user.uid, month.start, month.end),
      // Their categories' icons.
      getCategoryGroups(user.uid),
    ]),
  )
  const balanceSummary = getBalanceSummary(accounts)

  return (
    <Page>
      <PageHeader
        title="Tài khoản"
        actions={<AddAccountButton />}
      />

      {accounts.length > 0 ? (
        <BudgetLayout
          summary={<BalanceHero summary={balanceSummary} accounts={accounts} />}
        >
          <AccountList
            accounts={accounts}
            recentTransactions={recentTransactions}
            flows={flows}
            monthLabel={month.label}
            categoryGroups={categoryGroups}
          />
        </BudgetLayout>
      ) : (
        <AccountList
            accounts={accounts}
            recentTransactions={recentTransactions}
            flows={flows}
            monthLabel={month.label}
            categoryGroups={categoryGroups}
          />
      )}
      <FloatingActions>
        <AddAccountButton fab />
      </FloatingActions>
    </Page>
  )
}
