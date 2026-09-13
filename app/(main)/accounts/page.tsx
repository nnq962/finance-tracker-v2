import { requireSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"

import { AccountList } from "./_components/account-list"
import { AccountsHeader } from "./_components/accounts-header"
import { BalanceHero } from "./_components/balance-hero"

export default async function AccountsPage() {
  const user = await requireSession()
  const accounts = await getAccounts(user.uid)
  const balanceSummary = getBalanceSummary(accounts)

  return (
    <div className="space-y-8">
      <AccountsHeader />
      {accounts.length > 0 ? (
        <BalanceHero summary={balanceSummary} accounts={accounts} />
      ) : null}
      <AccountList accounts={accounts} />
    </div>
  )
}
