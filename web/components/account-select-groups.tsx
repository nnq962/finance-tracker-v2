import { AccountLogo } from "@/components/account-logo"
import {
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

const accountTypeGroups = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e-wallet", label: "Ví điện tử" },
] satisfies Array<{ value: Account["type"]; label: string }>

export function AccountSelectGroups({ accounts }: { accounts: Account[] }) {
  return accountTypeGroups.map((group) => {
    const groupAccounts = accounts.filter(
      (account) => account.type === group.value,
    )

    if (groupAccounts.length === 0) return null

    return (
      <SelectGroup key={group.value}>
        <SelectLabel>{group.label}</SelectLabel>
        {groupAccounts.map((account) => (
          <SelectItem
            key={account.id}
            value={account.id}
            textValue={account.name}
          >
            <AccountLogo account={account} size="xs" />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="min-w-0 truncate">{account.name}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {formatCurrency(account.balance)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectGroup>
    )
  })
}
