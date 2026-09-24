import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowDownLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarClockIcon,
  CircleDollarSignIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { todayDate } from "@/lib/debts/calculations"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { formatCurrency } from "@/lib/format-currency"
import { getOverviewSummary, type OverviewSummary } from "@/lib/overview/summary"
import { getTransactions } from "@/lib/transactions/repository"

import { CashFlowChart, SpendingChart } from "./_components/overview-charts"

const dueDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
})
const transactionDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh",
})

function SectionLink({ href, children }: { href: string; children: ReactNode }) {
  return <Button variant="ghost" size="sm" asChild><Link href={href}>{children}<ArrowRightIcon /></Link></Button>
}

function NetWorth({ data }: { data: OverviewSummary["netWorth"] }) {
  return (
    <section aria-labelledby="net-worth-title">
      <Card>
        <CardHeader>
          <CardTitle id="net-worth-title" className="flex items-center gap-2">
            <CircleDollarSignIcon className="size-5" aria-hidden="true" />Tài sản ròng hiện tại
          </CardTitle>
          <CardDescription>Số dư tài khoản + còn được trả − còn phải trả</CardDescription>
          <CardAction><SectionLink href="/accounts">Tài khoản</SectionLink></CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className={`flex min-h-64 flex-col justify-between rounded-xl bg-gradient-to-br p-6 text-white sm:p-8 ${data.total < 0 ? "from-rose-950 via-rose-800 to-orange-700" : "from-slate-900 via-teal-800 to-emerald-700"}`}>
              <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                <CircleDollarSignIcon className="size-4" aria-hidden="true" />Giá trị tài sản thực
              </p>
              <div className="space-y-3">
                <p className="[overflow-wrap:anywhere] text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl xl:text-6xl">
                  {formatCurrency(data.total)}
                </p>
                <p className="text-sm text-white/80">Tiền hiện có + tiền sẽ nhận − tiền cần trả</p>
              </div>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex min-w-0 items-center gap-4 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  <WalletCardsIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-blue-800/80 dark:text-blue-200/80">Số dư tài khoản</dt>
                  <dd className="[overflow-wrap:anywhere] text-lg font-semibold tabular-nums text-blue-950 dark:text-blue-50">{formatCurrency(data.cash)}</dd>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-4 rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  <ArrowDownLeftIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-emerald-800/80 dark:text-emerald-200/80">Còn được trả</dt>
                  <dd className="[overflow-wrap:anywhere] text-lg font-semibold tabular-nums text-emerald-950 dark:text-emerald-50">{formatCurrency(data.receivable, { signDisplay: "always" })}</dd>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-4 rounded-lg bg-rose-50 px-4 py-3 dark:bg-rose-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200">
                  <ArrowUpRightIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <dt className="text-sm text-rose-800/80 dark:text-rose-200/80">Còn phải trả</dt>
                  <dd className="[overflow-wrap:anywhere] text-lg font-semibold tabular-nums text-rose-950 dark:text-rose-50">{formatCurrency(-data.payable)}</dd>
                </div>
              </div>
            </dl>
          </div>
          <p className="text-sm text-muted-foreground">
            Các khoản vay nợ bao gồm lãi tạm tính đến hôm nay.
            {data.archivedCash !== 0 ? ` Số dư tài khoản bao gồm ${formatCurrency(data.archivedCash)} trong tài khoản đã ngừng sử dụng.` : ""}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

function CashFlow({ summary }: { summary: OverviewSummary }) {
  const { cashFlow } = summary
  return (
    <section aria-labelledby="cash-flow-title">
      <Card className="h-full">
        <CardHeader>
          <CardTitle id="cash-flow-title">Thu và chi</CardTitle>
          <CardDescription>Giao dịch thường trong 6 tháng gần nhất</CardDescription>
          <CardAction><Badge variant="secondary">{summary.monthLabel}</Badge></CardAction>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 border-b pb-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Thu tháng này</p>
              <p className="break-words text-xl font-semibold tabular-nums text-teal-700 dark:text-teal-400">{formatCurrency(cashFlow.current.income)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Chi tháng này</p>
              <p className="break-words text-xl font-semibold tabular-nums text-rose-700 dark:text-rose-400">{formatCurrency(cashFlow.current.expense)}</p>
            </div>
          </div>
          <CashFlowChart data={cashFlow} />
          <p className="text-sm text-muted-foreground">
            Chênh lệch tháng này: <span className="font-medium text-foreground tabular-nums">{formatCurrency(cashFlow.current.income - cashFlow.current.expense, { signDisplay: "always" })}</span>.
            {" "}Không gồm chuyển khoản, vay nợ và điều chỉnh số dư.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

function Spending({ summary }: { summary: OverviewSummary }) {
  return (
    <section aria-labelledby="spending-title">
      <Card className="h-full">
        <CardHeader>
          <CardTitle id="spending-title">Chi tiêu theo nhóm</CardTitle>
          <CardDescription>Nhóm chi nhiều nhất trong {summary.monthLabel.toLowerCase()}</CardDescription>
          <CardAction><SectionLink href="/transactions">Giao dịch</SectionLink></CardAction>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="border-b pb-5">
            <p className="text-sm text-muted-foreground">Tổng chi tháng này</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(summary.cashFlow.current.expense)}</p>
          </div>
          <SpendingChart data={summary.spending} />
          <p className="text-sm text-muted-foreground">
            {summary.spending.length > 5 ? `Hiển thị 5/${summary.spending.length} nhóm chi nhiều nhất.` : "Tính theo nhóm hạng mục của giao dịch chi."}
          </p>
        </CardContent>
      </Card>
    </section>
  )
}

function DueDebts({ debts }: { debts: OverviewSummary["dueDebts"] }) {
  return (
    <section aria-labelledby="due-debts-title" className="min-w-0">
      <Card className="h-full">
        <CardHeader>
          <CardTitle id="due-debts-title">Vay nợ cần chú ý</CardTitle>
          <CardDescription>Đã quá hạn hoặc đến hạn trong 14 ngày tới</CardDescription>
          <CardAction><SectionLink href="/debts">Xem tất cả</SectionLink></CardAction>
        </CardHeader>
        <CardContent>
          {debts.length ? (
            <ul className="divide-y">
              {debts.map((debt) => (
                <li key={debt.id}>
                  <Link href={`/debts?debt=${encodeURIComponent(debt.id)}`} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{debt.contactName}</p>
                      <p className="text-sm text-muted-foreground">
                        {debt.direction === "lent" ? "Cho vay" : "Đi vay"} · Hẹn {dueDateFormatter.format(new Date(`${debt.dueAt}T00:00:00+07:00`))}
                      </p>
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="min-w-0 space-y-1 text-right">
                        <p className="[overflow-wrap:anywhere] font-semibold tabular-nums">{formatCurrency(debt.remainingAmount)}</p>
                        <Badge variant={debt.daysUntilDue < 0 ? "destructive" : "outline"}>
                          {debt.daysUntilDue < 0 ? `Quá ${Math.abs(debt.daysUntilDue)} ngày` : debt.daysUntilDue === 0 ? "Đến hạn hôm nay" : `Còn ${debt.daysUntilDue} ngày`}
                        </Badge>
                      </div>
                      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="min-h-56">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CalendarClockIcon /></EmptyMedia>
                <EmptyTitle>Không có khoản sắp đến hạn</EmptyTitle>
                <EmptyDescription>Các khoản vay nợ có hạn trả gần sẽ xuất hiện ở đây.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function RecentTransactions({ transactions }: { transactions: OverviewSummary["recentTransactions"] }) {
  return (
    <section aria-labelledby="recent-transactions-title" className="min-w-0">
      <Card className="h-full">
        <CardHeader>
          <CardTitle id="recent-transactions-title">Giao dịch gần đây</CardTitle>
          <CardDescription>5 giao dịch mới nhất trong tài khoản</CardDescription>
          <CardAction><SectionLink href="/transactions">Xem tất cả</SectionLink></CardAction>
        </CardHeader>
        <CardContent>
          {transactions.length ? (
            <ul className="divide-y">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted" aria-hidden="true">
                    {transaction.kind === "income" ? <ArrowDownLeftIcon className="size-4" /> : transaction.kind === "expense" ? <ArrowUpRightIcon className="size-4" /> : <ReceiptTextIcon className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{transaction.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{transactionDateFormatter.format(new Date(transaction.occurredAt))} · {transaction.description}</p>
                  </div>
                  <span className={`col-start-2 min-w-0 [overflow-wrap:anywhere] font-semibold tabular-nums sm:col-start-3 sm:row-start-1 sm:text-right ${transaction.kind === "income" ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                    {formatCurrency(transaction.amount, { signDisplay: transaction.kind === "transfer" ? "never" : "always" })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="min-h-56">
              <EmptyHeader>
                <EmptyMedia variant="icon"><ReceiptTextIcon /></EmptyMedia>
                <EmptyTitle>Chưa có giao dịch</EmptyTitle>
                <EmptyDescription>Các khoản thu, chi và chuyển tiền sẽ xuất hiện ở đây.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default async function OverviewPage() {
  const user = await requireSession()
  const [accounts, debts, contacts, transactions] = await Promise.all([
    getAccounts(user.uid),
    getDebts(user.uid),
    getContacts(user.uid),
    getTransactions(user.uid),
  ])
  const summary = getOverviewSummary(accounts, debts, contacts, transactions, todayDate())

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12 md:space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tổng quan tài chính</h1>
          <p className="text-sm text-muted-foreground">Tài sản, thu chi và các khoản cần theo dõi.</p>
        </div>
        <Badge variant="outline">{summary.monthLabel}</Badge>
      </header>
      <NetWorth data={summary.netWorth} />
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <CashFlow summary={summary} />
        <Spending summary={summary} />
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DueDebts debts={summary.dueDebts} />
        <RecentTransactions transactions={summary.recentTransactions} />
      </div>
    </main>
  )
}
