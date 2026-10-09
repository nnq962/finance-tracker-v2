import { AccountLogo } from "@/components/account-logo"
import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { accountDescription } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import type { AccountFlow } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

/**
 * An account as a card in the accounts grid (desktop): its logo and name,
 * the balance, and under a line what came in and went out this month. The
 * whole card opens the account's sheet.
 */
export function AccountCard({ account, flow, onSelect }: { account: Account; flow?: AccountFlow; onSelect: () => void }) {
  const moneyIn = flow?.moneyIn ?? 0
  const moneyOut = flow?.moneyOut ?? 0
  const description = accountDescription(account)

  return (
    <Card size="lg" asChild className="pressable text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
      <button type="button" onClick={onSelect}>
        <CardContent className="flex flex-col gap-5">
          <span className="flex min-w-0 items-center gap-3">
            <AccountLogo account={account} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{account.name}</span>
              {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
            </span>
          </span>
          <span className="flex flex-col">
            <CardLabel as="span">Số dư</CardLabel>
            <Money amount={account.balance} size="lg" tone={account.balance < 0 ? "expense" : "default"} />
          </span>
          <span className="grid grid-cols-2 gap-2 border-t border-separator pt-4 text-sm">
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">Vào tháng này</span>
              <span className={cn("font-semibold tabular-nums", moneyIn > 0 && "text-income")}>
                {moneyIn > 0 ? "+" : ""}
                {formatCompactCurrency(moneyIn, 1)}
              </span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-xs text-muted-foreground">Ra tháng này</span>
              <span className="font-semibold tabular-nums">
                {moneyOut > 0 ? "−" : ""}
                {formatCompactCurrency(moneyOut, 1)}
              </span>
            </span>
          </span>
        </CardContent>
      </button>
    </Card>
  )
}
