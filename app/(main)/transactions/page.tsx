import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CarIcon,
  ChevronDownIcon,
  CircleDollarSignIcon,
  HouseIcon,
  LandmarkIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  SlidersHorizontalIcon,
  UtensilsIcon,
  ZapIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/format-currency"

const transactions = [
  { id: "FT-24091", name: "Lương tháng 9", category: "Thu nhập", account: "Vietcombank", date: "11/09/2026", amount: 35_000_000, icon: LandmarkIcon },
  { id: "FT-24090", name: "WinMart", category: "Mua sắm", account: "Momo", date: "10/09/2026", amount: -1_248_000, icon: ShoppingBagIcon },
  { id: "FT-24089", name: "Pizza 4P’s", category: "Ăn uống", account: "Techcombank", date: "09/09/2026", amount: -865_000, icon: UtensilsIcon },
  { id: "FT-24088", name: "Grab", category: "Di chuyển", account: "Momo", date: "09/09/2026", amount: -128_000, icon: CarIcon },
  { id: "FT-24087", name: "Tiền điện tháng 8", category: "Hoá đơn", account: "Vietcombank", date: "08/09/2026", amount: -1_426_000, icon: ZapIcon },
  { id: "FT-24086", name: "Tiền thuê nhà", category: "Nhà ở", account: "Techcombank", date: "05/09/2026", amount: -8_500_000, icon: HouseIcon },
  { id: "FT-24085", name: "Freelance website", category: "Thu nhập", account: "Vietcombank", date: "03/09/2026", amount: 7_800_000, icon: CircleDollarSignIcon },
]

const transactionSummary = {
  income: 42_800_000,
  expense: 24_350_000,
  netCashFlow: 18_450_000,
}

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giao dịch</h1>
          <p className="text-sm text-muted-foreground">Theo dõi tất cả khoản thu và chi của bạn.</p>
        </div>
        <Button>
          <PlusIcon />
          Thêm giao dịch
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpRightIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
            Tổng thu
          </div>
          <p className="mt-3 text-xl font-semibold tracking-tight">{formatCurrency(transactionSummary.income)}</p>
          <p className="mt-1 text-xs text-muted-foreground">2 giao dịch trong tháng</p>
        </article>
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDownLeftIcon className="size-4 text-rose-600 dark:text-rose-400" />
            Tổng chi
          </div>
          <p className="mt-3 text-xl font-semibold tracking-tight">{formatCurrency(transactionSummary.expense)}</p>
          <p className="mt-1 text-xs text-muted-foreground">18 giao dịch trong tháng</p>
        </article>
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDollarSignIcon className="size-4" />
            Dòng tiền ròng
          </div>
          <p className="mt-3 text-xl font-semibold tracking-tight">
            {formatCurrency(transactionSummary.netCashFlow, { signDisplay: "always" })}
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Tăng 12,6% so với tháng trước</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Tìm kiếm giao dịch..." aria-label="Tìm kiếm giao dịch" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              Tháng này
              <ChevronDownIcon />
            </Button>
            <Button variant="outline">
              Tất cả danh mục
              <ChevronDownIcon />
            </Button>
            <Button variant="outline" size="icon" aria-label="Bộ lọc nâng cao">
              <SlidersHorizontalIcon />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-sm">
            <thead className="bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Giao dịch</th>
                <th className="px-5 py-3 font-medium">Danh mục</th>
                <th className="px-5 py-3 font-medium">Tài khoản</th>
                <th className="px-5 py-3 font-medium">Ngày</th>
                <th className="px-5 py-3 text-right font-medium">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <transaction.icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-xs text-muted-foreground">{transaction.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{transaction.category}</td>
                  <td className="px-5 py-4 text-muted-foreground">{transaction.account}</td>
                  <td className="px-5 py-4 text-muted-foreground">{transaction.date}</td>
                  <td className={`px-5 py-4 text-right font-semibold tabular-nums ${transaction.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {formatCurrency(transaction.amount, { signDisplay: "always" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
          <span>Hiển thị 7 trong 20 giao dịch</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Trước</Button>
            <Button variant="outline" size="sm">Sau</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
