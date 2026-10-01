import { loadWithSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"
import { getCategoryGroups } from "@/lib/categories/repository"

import { AccountList } from "./_components/account-list"
import { AccountsHeader } from "./_components/accounts-header"
import { AddAccountButton } from "./_components/add-account-button"
import { BalanceHero } from "./_components/balance-hero"

export default async function AccountsPage() {
  const { data: [accounts, categoryGroups] } = await loadWithSession((user) =>
    Promise.all([getAccounts(user.uid), getCategoryGroups(user.uid)]),
  )
  const balanceSummary = getBalanceSummary(accounts)
  const availableCategoryGroups = categoryGroups.filter(
    (group) => group.items.length > 0,
  )

  return (
    <div className="space-y-8">
      <AccountsHeader>
        <AddAccountButton />
      </AccountsHeader>
      {accounts.length > 0 ? (
        <BalanceHero summary={balanceSummary} accounts={accounts} />
      ) : null}
      <AccountList
        accounts={accounts}
        categoryGroups={availableCategoryGroups}
      />
      {/* On mobile the action floats above the bottom nav so it stays within
          thumb reach while scrolling. The empty state carries its own button. */}
      {accounts.length > 0 ? (
        <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end md:hidden">
          <div className="pointer-events-auto">
            <AddAccountButton />
          </div>
        </div>
      ) : null}
    </div>
  )
}
