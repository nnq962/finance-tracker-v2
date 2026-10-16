import { AccountLogo } from "@/components/account-logo"
import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { accountDescription } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"

/**
 * An account as a card in the accounts grid (desktop): its logo and name,
 * and the balance (this month's in and out left it on 2026-10-16). The whole
 * card opens the account's sheet.
 */
export function AccountCard({ account, onSelect }: { account: Account; onSelect: () => void }) {
  const description = accountDescription(account)

  return (
    <Card size="lg" asChild className="pressable text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
      <button type="button" onClick={onSelect}>
        {/* Its name at the top and its balance at the foot, as tall as the cards beside it. */}
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          <span className="flex min-w-0 items-center gap-3">
            <AccountLogo account={account} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{account.name}</span>
              {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
            </span>
          </span>
          <span className="flex flex-col">
            {/* Left out of the figures: said by the label, the balance grey, as in the list. */}
            <CardLabel as="span">{account.excluded ? "Số dư · Ngoài báo cáo" : "Số dư"}</CardLabel>
            <Money
              amount={account.balance}
              size="lg"
              tone={account.excluded ? "muted" : account.balance < 0 ? "expense" : "default"}
            />
          </span>
        </CardContent>
      </button>
    </Card>
  )
}
