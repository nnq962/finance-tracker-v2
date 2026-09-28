import { WalletCardsIcon } from "lucide-react"
import type { CSSProperties } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getAccountDistribution } from "@/lib/accounts/distribution"
import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

type BalanceHeroProps = {
  summary: BalanceSummary
  accounts: Account[]
}

export function BalanceHero({ summary, accounts }: BalanceHeroProps) {
  const { distribution, accountsTotal } = getAccountDistribution(accounts)
  const gradientStops: string[] = []
  let gradientOffset = 0

  if (accountsTotal > 0) {
    for (const account of distribution) {
      if (account.distributionBalance <= 0) continue

      const start = gradientOffset
      gradientOffset += account.distributionBalance / accountsTotal * 100
      gradientStops.push(`${account.fill} ${start}% ${gradientOffset}%`)
    }
  }

  const distributionProgressStyle = {
    "--distribution-gradient": gradientStops.length > 0
      ? `linear-gradient(to right, ${gradientStops.join(", ")})`
      : "none",
  } as CSSProperties

  return (
    <Card className="relative [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
      <CardContent className="@container/hero min-w-0">
        <Badge
          variant="secondary"
          className="absolute top-(--card-spacing) right-(--card-spacing) z-10 @min-[48rem]:hidden"
        >
          {distribution.length} tài khoản
        </Badge>
        <div className="grid min-w-0 items-center gap-5 @min-[48rem]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] @min-[48rem]:gap-8">
          <div className="min-w-0 pr-28 @min-[48rem]:pr-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <WalletCardsIcon className="size-4 shrink-0" aria-hidden="true" />
              <span>Tổng số dư khả dụng</span>
            </div>
            <p className="mt-2 font-heading text-3xl font-extrabold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere] @min-[28rem]:text-4xl">
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="mt-1 hidden flex-wrap gap-x-1 text-xs leading-relaxed text-muted-foreground @min-[48rem]:flex">
              <span>Cập nhật {summary.updatedAt}</span>
              <span>· {distribution.length} tài khoản</span>
            </p>
          </div>

          <div className="@container/distribution min-w-0">
            <div className="mb-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <h2 className="text-sm font-semibold">Phân bổ theo tài khoản</h2>
              <span className="shrink-0 text-xs @min-[48rem]/hero:hidden">
                Cập nhật {summary.updatedAt}
              </span>
            </div>
            {distribution.length > 0 ? (
              <>
                <Progress
                  value={accountsTotal > 0 ? 100 : 0}
                  aria-hidden="true"
                  className="mb-4 [&_[data-slot=progress-indicator]]:[background-image:var(--distribution-gradient)]"
                  style={distributionProgressStyle}
                />
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
                        <span className="col-start-2 row-start-1 text-right text-sm tabular-nums text-muted-foreground @min-[20rem]/distribution:col-start-3">
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
