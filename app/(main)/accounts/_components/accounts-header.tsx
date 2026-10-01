import type { ReactNode } from "react"

type AccountsHeaderProps = {
  children: ReactNode
}

export function AccountsHeader({ children }: AccountsHeaderProps) {
  return (
    <header className="pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">
            Tài khoản
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Theo dõi số dư và quản lý các tài khoản của bạn.
          </p>
        </div>
        {/* Below md the add action floats above the bottom nav instead. */}
        <div className="hidden shrink-0 md:block">{children}</div>
      </div>
    </header>
  )
}
