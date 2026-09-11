import { AccountCard } from "./account-card"

import type { AccountGroup as AccountGroupModel } from "../_types/account"

type AccountGroupProps = {
  group: AccountGroupModel
}

export function AccountGroup({ group }: AccountGroupProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          {group.description ? (
            <p className="text-sm text-muted-foreground">
              {group.description}
            </p>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {group.accounts.length} tài khoản
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {group.accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  )
}
