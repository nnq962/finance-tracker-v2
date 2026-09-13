import type { ReactNode } from "react"

type DebtsHeaderProps = {
  actions: ReactNode
}

export function DebtsHeader({ actions }: DebtsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Sổ ghi nợ cá nhân</p>
        <h1 className="text-2xl font-semibold tracking-tight">Nợ &amp; Cho vay</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Theo dõi ai đang nợ bạn, bạn đang nợ ai và quản lý danh bạ cho các khoản vay.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </header>
  )
}
