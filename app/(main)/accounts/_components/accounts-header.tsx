import { Separator } from "@/components/ui/separator"

import { AddAccountButton } from "./add-account-button"

export function AccountsHeader() {
  return (
    <header className="space-y-6 pt-1">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">
            Tài khoản
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Theo dõi số dư và quản lý các tài khoản của bạn.
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">
          <AddAccountButton />
        </div>
      </div>
      <Separator />
    </header>
  )
}
