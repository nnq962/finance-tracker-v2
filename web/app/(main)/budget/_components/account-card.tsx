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
    <Card size="lg" asChild className="pressable text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/30 [@media(hover:hover)]:hover:shadow-[0_12px_48px_rgb(0_0_0/0.16)] [@media(hover:hover)]:transition-[scale,box-shadow]">
      <button type="button" onClick={onSelect}>
        {/* Its name at the top and its balance at the foot, as tall as the cards beside it. */}
        <CardContent className="flex flex-1 flex-col justify-between gap-4">
          {/* Top-aligned, the text block as tall as the logo, so names line up across cards with and without a second line (2026-10-21). */}
          <span className="flex min-w-0 items-start gap-3">
            <AccountLogo account={account} />
            <span className="flex min-h-9 min-w-0 flex-col justify-center">
              <span className="truncate font-medium">{account.name}</span>
              {description ? <span className="truncate text-xs text-muted-foreground">{description}</span> : null}
            </span>
          </span>
          <span className="flex flex-col">
            {/* The figure says it is the balance (no "Số dư" label since 2026-10-16); left out of the figures, it says so, the balance grey. */}
            {account.excluded ? <CardLabel as="span">Ngoài báo cáo</CardLabel> : null}
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
