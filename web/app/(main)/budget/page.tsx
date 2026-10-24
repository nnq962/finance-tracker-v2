import { Page, PageHeader } from "@/components/page"
import { loadWithSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"
import { getCategoryGroups } from "@/lib/categories/repository"
import { getRecentTransactionsByAccount } from "@/lib/transactions/repository"

import { AccountList } from "./_components/account-list"
import { AddAccountButton } from "./_components/add-account-button"
import { BalanceHero } from "./_components/balance-hero"
import { BudgetLayout } from "./_components/budget-layout"

export default async function AccountsPage({ searchParams }: { searchParams: Promise<{ account?: string }> }) {
  // An account to open straight away, e.g. from a notice.
  const { account: openAccountId } = await searchParams
  const { data: [accounts, recentTransactions, categoryGroups] } = await loadWithSession("budget", (user) =>
    Promise.all([
      getAccounts(user.uid),
      // A few per account, shown when its sheet opens without another round trip.
      getRecentTransactionsByAccount(user.uid),
      // Their categories' icons.
      getCategoryGroups(user.uid),
    ]),
  )
  const balanceSummary = getBalanceSummary(accounts)

  return (
    <Page>
      {/* Accounts and jars are added from the + alone (2026-10-24, the lists' add rows and cards
          went): in the bar on phones, in the top bar from md. */}
      <PageHeader title="Tài khoản" bare accessory={<AddAccountButton />} />

      {accounts.length > 0 ? (
        <BudgetLayout
          summary={<BalanceHero summary={balanceSummary} accounts={accounts} />}
        >
          <AccountList
            accounts={accounts}
            recentTransactions={recentTransactions}
            categoryGroups={categoryGroups}
            initialOpenId={openAccountId}
            // Another account asked for (a second notice) opens afresh.
            key={openAccountId}
          />
        </BudgetLayout>
      ) : (
        <AccountList
            accounts={accounts}
            recentTransactions={recentTransactions}
            categoryGroups={categoryGroups}
          />
      )}
    </Page>
  )
}
