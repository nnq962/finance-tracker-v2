import type { ReactNode } from "react"

type TransactionsHeaderProps = {
  children: ReactNode
}

export function TransactionsHeader({ children }: TransactionsHeaderProps) {
  return (
    <header className="pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Giao dịch</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Theo dõi các khoản thu, chi và chuyển khoản của bạn.
          </p>
        </div>
        {/* Below md the add action floats above the bottom nav instead. */}
        <div className="hidden shrink-0 md:block">{children}</div>
      </div>
    </header>
  )
}
