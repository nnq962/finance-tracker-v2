import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CarIcon,
  EllipsisIcon,
  LandmarkIcon,
  PiggyBankIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/format-currency"

const overviewCards = [
  {
    label: "Tổng số dư",
    value: 128_450_000,
    change: "+4,2%",
    icon: WalletCardsIcon,
    tone: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
  },
  {
    label: "Thu nhập tháng này",
    value: 42_800_000,
    change: "+8,1%",
    icon: ArrowUpRightIcon,
    tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: "Chi tiêu tháng này",
    value: 24_350_000,
    change: "-2,4%",
    icon: ArrowDownRightIcon,
    tone: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
  },
  {
    label: "Tiết kiệm",
    value: 18_450_000,
    change: "43,1% thu nhập",
    icon: PiggyBankIcon,
    tone: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
  },
]

const cashFlow = [42, 58, 46, 72, 64, 82, 68, 92, 76, 88, 70, 84]

const recentTransactions = [
  { name: "Lương tháng 9", category: "Thu nhập", amount: 35_000_000, date: "Hôm nay, 09:15", icon: LandmarkIcon },
  { name: "WinMart", category: "Mua sắm", amount: -1_248_000, date: "Hôm qua, 19:42", icon: ShoppingBagIcon },
  { name: "Pizza 4P’s", category: "Ăn uống", amount: -865_000, date: "09/09, 20:10", icon: UtensilsIcon },
  { name: "Grab", category: "Di chuyển", amount: -128_000, date: "09/09, 08:24", icon: CarIcon },
]

const monthlyBudget = {
  spent: 24_350_000,
  total: 35_000_000,
}

const budgetCategories = [
  { label: "Ăn uống", amount: 6_240_000, width: "78%" },
  { label: "Mua sắm", amount: 4_850_000, width: "61%" },
  { label: "Di chuyển", amount: 2_180_000, width: "44%" },
]

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tổng quan tài chính</h1>
          <p className="text-sm text-muted-foreground">Tình hình thu chi và tài sản của bạn trong tháng này.</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">Tháng 9, 2026</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mở dropdown shadcn mặc định"
              >
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
              <DropdownMenuItem>Nhân bản</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Xoá</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article key={card.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className={`flex size-9 items-center justify-center rounded-lg ${card.tone}`}>
                <card.icon className="size-4" />
              </div>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{card.change}</span>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight">{formatCurrency(card.value)}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Dòng tiền</h2>
              <p className="text-sm text-muted-foreground">Thu nhập và chi tiêu 12 tháng gần nhất</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground" />Thu</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/30" />Chi</span>
            </div>
          </div>
          <div className="mt-8 flex h-56 items-end gap-2 sm:gap-3">
            {cashFlow.map((height, index) => (
              <div key={index} className="flex h-full flex-1 items-end gap-1">
                <div className="w-1/2 rounded-t-sm bg-foreground" style={{ height: `${height}%` }} />
                <div className="w-1/2 rounded-t-sm bg-muted-foreground/25" style={{ height: `${Math.max(height - 24, 18)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-6 text-center text-xs text-muted-foreground sm:grid-cols-12">
            {cashFlow.map((_, index) => <span key={index}>T{index + 1}</span>)}
          </div>
        </article>

        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Ngân sách tháng</h2>
          <p className="text-sm text-muted-foreground">
            Đã dùng {formatCurrency(monthlyBudget.spent)} trên {formatCurrency(monthlyBudget.total)}
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[70%] rounded-full bg-foreground" />
          </div>
          <div className="mt-6 space-y-5">
            {budgetCategories.map((category) => (
              <div key={category.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{category.label}</span>
                  <span className="text-muted-foreground">{formatCurrency(category.amount)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: category.width }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Giao dịch gần đây</h2>
          <p className="text-sm text-muted-foreground">Các biến động mới nhất trong tài khoản</p>
        </div>
        <div className="divide-y">
          {recentTransactions.map((transaction) => (
            <div key={transaction.name} className="flex items-center gap-3 px-5 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <transaction.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{transaction.name}</p>
                <p className="text-xs text-muted-foreground">{transaction.category} · {transaction.date}</p>
              </div>
              <p className={`text-sm font-semibold tabular-nums ${transaction.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {formatCurrency(transaction.amount, { signDisplay: "always" })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
