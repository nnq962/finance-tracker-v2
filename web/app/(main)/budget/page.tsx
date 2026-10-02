import { Page, PageHeader } from "@/components/page"
import { loadWithSession } from "@/lib/auth/session"
import { getAccounts } from "@/lib/accounts/repository"
import { getBalanceSummary } from "@/lib/accounts/summary"

import { AccountList } from "./_components/account-list"
import { AddAccountButton } from "./_components/add-account-button"
import { BalanceHero } from "./_components/balance-hero"

export default async function AccountsPage() {
  const { data: accounts } = await loadWithSession((user) =>
    getAccounts(user.uid),
  )
  const balanceSummary = getBalanceSummary(accounts)

  return (
    <Page>
      <PageHeader
        title="Ngân sách"
        actions={<AddAccountButton />}
      />
      {accounts.length > 0 ? (
        <BalanceHero summary={balanceSummary} accounts={accounts} />
      ) : null}
      <AccountList accounts={accounts} />
      {/* On mobile the action floats above the bottom nav so it stays within
          thumb reach while scrolling. The empty state carries its own button. */}
      {accounts.length > 0 ? (
        <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end md:hidden">
          <div className="pointer-events-auto">
            <AddAccountButton />
          </div>
        </div>
      ) : null}
    </Page>
  )
}
