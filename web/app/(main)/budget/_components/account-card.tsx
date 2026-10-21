import { AccountLogo } from "@/components/account-logo"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { accountDescription } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import { cn } from "@/lib/utils"

import { GridCardHead, gridButtonCardClassName, gridCardContentClassName } from "./account-grid"

/**
 * An account as a card of the accounts grid (desktop): its logo, name and
 * kind at the top, its balance at the foot. A locked account is greyed (its
 * logo faded, its balance grey), so it does not read as one in use; one left
 * out of the figures says so, its balance grey. The whole card opens the
 * account's sheet.
 */
export function AccountCard({ account, onSelect }: { account: Account; onSelect: () => void }) {
  const locked = account.status === "archived"
  return (
    <Card size="lg" asChild className={gridButtonCardClassName}>
      <button type="button" onClick={onSelect}>
        <CardContent className={gridCardContentClassName}>
          <GridCardHead
            media={<AccountLogo account={account} className={cn(locked && "opacity-50")} />}
            title={<span className={cn(locked && "text-muted-foreground")}>{account.name}</span>}
            description={account.excluded ? "Ngoài báo cáo" : accountDescription(account)}
          />
          <Money
            amount={account.balance}
            size="lg"
            tone={locked || account.excluded ? "muted" : account.balance < 0 ? "expense" : "default"}
          />
        </CardContent>
      </button>
    </Card>
  )
}
