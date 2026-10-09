import { CardLabel } from "@/components/app/card-label"
import { Money } from "@/components/app/money"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// The half ring: radius 80 in a 200×110 box, a 16 stroke with round caps.
const arc = "M 20 100 A 80 80 0 0 1 180 100"
const arcLength = Math.PI * 80
// Round caps reach 8 past each end: 16 of the gap is under them, 4 shows.
const arcGap = 20

function HalfRing({ share }: { share: number | null }) {
  const stroke = { fill: "none", strokeWidth: 16, strokeLinecap: "round" as const }
  if (share === null) return <path d={arc} {...stroke} className="stroke-muted" />
  if (share >= 1) return <path d={arc} {...stroke} className="stroke-income" />
  if (share <= 0) return <path d={arc} {...stroke} className="stroke-foreground" />
  const split = arcLength * share
  return (
    <>
      <path
        d={arc}
        {...stroke}
        className="stroke-foreground"
        strokeDasharray={`${Math.max(arcLength - split - arcGap / 2, 0.01)} ${arcLength}`}
        strokeDashoffset={-(split + arcGap / 2)}
      />
      <path d={arc} {...stroke} className="stroke-income" strokeDasharray={`${Math.max(split - arcGap / 2, 0.01)} ${arcLength}`} />
    </>
  )
}

function balanceNote(net: number, total: number) {
  if (total === 0) return "Chưa có khoản nào cần thu hay trả"
  if (net > 0) return "Bạn được nợ nhiều hơn đang nợ"
  if (net < 0) return "Bạn đang nợ nhiều hơn được nợ"
  return "Cần thu và cần trả bằng nhau"
}

/**
 * The debts page's lead card: a half ring weighs what is owed to you (green)
 * against what you owe (ink). On phones the balance sits inside it, the two
 * figures under its ends and a line says which way it leans. From lg up the
 * card lies across the page (chosen 2026-10-09): the ring on the left, the
 * balance, owed to you and owed by you as three figures on the right.
 */
export function DebtBalance({
  lent,
  borrowed,
  lentCount,
  borrowedCount,
}: {
  lent: number
  borrowed: number
  lentCount: number
  borrowedCount: number
}) {
  const total = lent + borrowed
  const net = lent - borrowed
  return (
    <Card size="lg" role="region" aria-label="Cần thu và cần trả">
      <CardContent className="flex flex-col items-center lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div className="relative w-full max-w-64">
          <svg viewBox="0 0 200 110" className="w-full" aria-hidden="true">
            <HalfRing share={total === 0 ? null : lent / total} />
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center lg:hidden">
            <CardLabel>Ròng</CardLabel>
            <Money amount={net} size="lg" sign={net === 0 ? "never" : "always"} />
          </div>
        </div>
        <div className="hidden grid-cols-3 gap-6 lg:grid">
          <div className="flex min-w-0 flex-col gap-1">
            <CardLabel>Ròng</CardLabel>
            <Money amount={net} size="lg" sign={net === 0 ? "never" : "always"} />
            <span className="text-xs text-muted-foreground">{balanceNote(net, total)}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-income" />
              <span className="truncate">Cần thu · {lentCount} khoản</span>
            </span>
            <Money amount={lent} size="lg" tone={lent > 0 ? "income" : "default"} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-foreground" />
              <span className="truncate">Cần trả · {borrowedCount} khoản</span>
            </span>
            <Money amount={borrowed} size="lg" />
          </div>
        </div>
        <div className="mt-4 grid w-full grid-cols-2 gap-4 lg:hidden">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-income" />
              <span className="truncate">Cần thu · {lentCount} khoản</span>
            </span>
            <Money amount={lent} size="md" tone={lent > 0 ? "income" : "default"} />
          </div>
          <div className="flex min-w-0 flex-col items-end gap-0.5 text-right">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">Cần trả · {borrowedCount} khoản</span>
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-foreground" />
            </span>
            <Money amount={borrowed} size="md" />
          </div>
        </div>
        <span className="mt-4 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground lg:hidden">
          {balanceNote(net, total)}
        </span>
      </CardContent>
    </Card>
  )
}

/** Same footprint as DebtBalance, for loading states. */
export function DebtBalanceSkeleton() {
  return (
    <Card size="lg" aria-hidden="true">
      <CardContent className="flex flex-col items-center lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div className="relative w-full max-w-64">
          <svg viewBox="0 0 200 110" className="w-full">
            <HalfRing share={null} />
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center gap-2 lg:hidden">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="hidden grid-cols-3 gap-6 lg:grid">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-4 grid w-full grid-cols-2 gap-4 lg:hidden">
          {[0, 1].map((index) => (
            <div key={index} className="flex flex-col gap-2 even:items-end">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-6 w-48 rounded-full lg:hidden" />
      </CardContent>
    </Card>
  )
}
