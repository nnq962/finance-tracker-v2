import { AddAccountButton } from "./add-account-button"

export function AccountsHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi số dư và quản lý các tài khoản của bạn.
        </p>
      </div>
      <AddAccountButton />
    </header>
  )
}
