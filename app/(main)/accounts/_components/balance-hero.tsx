import { WalletCardsIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const { distribution, accountsTotal } = getAccountDistribution(accounts)

  return (
    <Card className="[--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardContent className="@container min-w-0">
        <div className="grid min-w-0 items-center gap-5 @min-[48rem]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] @min-[48rem]:gap-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <WalletCardsIcon className="size-4 shrink-0" aria-hidden="true" />
              <span>Tổng số dư khả dụng</span>
            </div>
            <p className="mt-2 font-heading text-3xl font-extrabold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere] @min-[28rem]:text-4xl">
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="mt-1 flex flex-wrap gap-x-1 text-xs leading-relaxed text-muted-foreground">
              <span>Cập nhật {summary.updatedAt}</span>
              <span>· {distribution.length} tài khoản</span>
            </p>
          </div>

          <div className="@container/distribution min-w-0">
            <div className="mb-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <h2 className="text-sm font-semibold">Phân bổ theo tài khoản</h2>
              <span className="shrink-0">Số dư</span>
            </div>
            {distribution.length > 0 ? (
              <>
                <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  {distribution.filter((account) => account.distributionBalance > 0).map((account) => (
                    <span
                      key={account.id}
                      className="h-full min-w-0 border-r-2 border-card last:border-r-0"
                      style={{
                        width: `${account.distributionBalance / accountsTotal * 100}%`,
                        backgroundColor: account.fill,
                      }}
                    />
                  ))}
                </div>
                <ul className="grid min-w-0 grid-cols-1 gap-y-2.5">
                  {distribution.map((account) => {
                    return (
                      <li key={account.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 @min-[20rem]/distribution:grid-cols-[minmax(0,1fr)_auto_3ch]">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: account.fill }} aria-hidden="true" />
                          <span className="truncate text-sm" title={account.name}>{account.name}</span>
                        </div>
                        <span className="col-start-1 row-start-2 min-w-0 pl-4.5 text-sm font-bold tabular-nums [overflow-wrap:anywhere] @min-[20rem]/distribution:col-start-2 @min-[20rem]/distribution:row-start-1 @min-[20rem]/distribution:pl-0">
                          {formatCurrency(account.balance)}
                        </span>
                        <span className="col-start-2 row-start-1 text-right text-xs tabular-nums text-muted-foreground @min-[20rem]/distribution:col-start-3">
                          {account.percentageLabel}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {accountsTotal === 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">Chưa có số dư dương để hiển thị phân bổ.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có tài khoản đang hoạt động.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
