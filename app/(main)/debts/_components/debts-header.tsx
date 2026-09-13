import type { ReactNode } from "react"

import { Separator } from "@/components/ui/separator"

type DebtsHeaderProps = {
  actions: ReactNode
}

export function DebtsHeader({ actions }: DebtsHeaderProps) {
  return (
    <header className="space-y-6 pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">
            Nợ &amp; Cho vay
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Theo dõi ai đang nợ bạn, bạn đang nợ ai và quản lý danh bạ cho
            các khoản vay.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
          {actions}
        </div>
      </div>
      <Separator />
    </header>
  )
}
