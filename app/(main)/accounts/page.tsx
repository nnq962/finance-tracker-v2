import { requireSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"
import { getCategoryGroups } from "@/lib/categories/repository"

import { AccountList } from "./_components/account-list"
import { AccountsHeader } from "./_components/accounts-header"
import { BalanceHero } from "./_components/balance-hero"

export default async function AccountsPage() {
  const user = await requireSession()
  const [accounts, categoryGroups] = await Promise.all([
    getAccounts(user.uid),
    getCategoryGroups(user.uid),
  ])
  const balanceSummary = getBalanceSummary(accounts)
  const availableCategoryGroups = categoryGroups.filter(
    (group) => group.items.length > 0,
  )

  return (
    <div className="space-y-8">
      <AccountsHeader />
      {accounts.length > 0 ? (
        <BalanceHero summary={balanceSummary} accounts={accounts} />
      ) : null}
      <AccountList
        accounts={accounts}
        categoryGroups={availableCategoryGroups}
      />
    </div>
  )
}
