import { AccountGroup } from "./_components/account-group"
import { AccountsHeader } from "./_components/accounts-header"
import { BalanceHero } from "./_components/balance-hero"
import { accountGroups, balanceSummary } from "./_data/accounts"

const accounts = accountGroups.flatMap((group) => group.accounts)

export default function AccountsPage() {
  return (
    <div className="space-y-8">
      <AccountsHeader />
      <BalanceHero summary={balanceSummary} accounts={accounts} />
      {accountGroups.map((group) => (
        <AccountGroup key={group.type} group={group} />
      ))}
    </div>
  )
}
