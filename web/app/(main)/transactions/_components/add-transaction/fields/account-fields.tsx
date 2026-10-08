"use client"

import { ArrowLeftRightIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

const accountTypeGroups = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e-wallet", label: "Ví điện tử" },
] satisfies Array<{ value: Account["type"]; label: string }>

/** A transfer needs two accounts it can use: active ones, or those of the transfer being edited. */
export function canTransfer(accounts: Account[], keep: string[] = []) {
  return accounts.filter((account) => account.status === "active" || keep.includes(account.id)).length >= 2
}

/**
 * The accounts to pick from on a deeper screen of the sheet, by type, each
 * with its logo and balance: a tap picks one and goes back.
 */
export function AccountPicker({
  accounts,
  value,
  onPick,
}: {
  accounts: Account[]
  value: string
  onPick: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {accountTypeGroups.map((group) => {
        const groupAccounts = accounts.filter((account) => account.type === group.value)
        if (groupAccounts.length === 0) return null
        return (
          <SettingsGroup key={group.value} title={group.label}>
            {groupAccounts.map((account) => (
              <SettingsRow
                key={account.id}
                media={<AccountLogo account={account} />}
                title={account.name}
                description={account.status === "archived" ? "Đã lưu trữ" : formatCurrency(account.balance)}
                checked={value === account.id}
                onClick={() => onPick(account.id)}
              />
            ))}
          </SettingsGroup>
        )
      })}
    </div>
  )
}

/** One side of a transfer: its logo and name, or a prompt when none is picked. */
function TransferSide({
  id,
  label,
  account,
  invalid,
  onClick,
}: {
  id: string
  label: string
  account?: Account
  invalid: boolean
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className="pressable flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      {account ? (
        <AccountLogo account={account} />
      ) : (
        <span className={cn("size-9 rounded-[10px] border-2 border-dashed", invalid ? "border-destructive/60" : "border-border")} />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("w-full truncate text-sm font-medium", !account && (invalid ? "text-destructive" : "text-muted-foreground"))}>
        {account?.name ?? "Chọn tài khoản"}
      </span>
    </button>
  )
}

/**
 * Where a transfer goes, the two accounts side by side, each opening the
 * account list; the button between them swaps them. Submitted as
 * fromAccountId and toAccountId.
 */
export function TransferAccounts({
  accounts,
  fromAccountId,
  toAccountId,
  onPickFrom,
  onPickTo,
  onSwap,
  fromError,
  toError,
}: {
  accounts: Account[]
  fromAccountId: string
  toAccountId: string
  onPickFrom: () => void
  onPickTo: () => void
  onSwap: () => void
  fromError?: string
  toError?: string
}) {
  const byId = (id: string) => accounts.find((account) => account.id === id)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 rounded-[20px] bg-card p-2">
        <TransferSide id="transfer-from-account" label="Từ" account={byId(fromAccountId)} invalid={Boolean(fromError)} onClick={onPickFrom} />
        <Button type="button" variant="secondary" size="icon-sm" aria-label="Đổi chiều chuyển" onClick={onSwap}>
          <ArrowLeftRightIcon />
        </Button>
        <TransferSide id="transfer-to-account" label="Đến" account={byId(toAccountId)} invalid={Boolean(toError)} onClick={onPickTo} />
      </div>
      {fromError || toError ? <FieldError className="px-4">{fromError ?? toError}</FieldError> : null}
      <input type="hidden" name="fromAccountId" value={fromAccountId} />
      <input type="hidden" name="toAccountId" value={toAccountId} />
    </div>
  )
}
