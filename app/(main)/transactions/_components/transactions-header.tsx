import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

type TransactionsHeaderProps = {
  children: ReactNode
}

export function TransactionsHeader({ children }: TransactionsHeaderProps) {
  return (
    <header className="space-y-6 pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">Giao dịch</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Theo dõi các khoản thu, chi và chuyển khoản của bạn.
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">{children}</div>
      </div>
      <Separator />
    </header>
  )
}
