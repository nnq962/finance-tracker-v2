import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

type TransactionsHeaderProps = {
  children: ReactNode
}

export function TransactionsHeader({ children }: TransactionsHeaderProps) {
  return (
    <header className="space-y-6 pt-2">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Giao dịch
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Theo dõi các khoản thu, chi và chuyển khoản của bạn.
          </p>
        </div>
        {children}
      </div>
      <Separator />
    </header>
  )
}
