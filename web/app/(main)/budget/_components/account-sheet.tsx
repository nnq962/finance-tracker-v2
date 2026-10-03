"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { accountTypeLabels } from "@/lib/accounts/distribution"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatShortDate, formatTime, toDateKey } from "@/lib/format-date"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { getTransactionVisual } from "../../transactions/_lib/transaction-presentation"
import { setAccountArchivedAction } from "../actions"
import { DeleteAccountAlert } from "./account-actions/delete-account-alert"
import { EditAccountSheet } from "./account-actions/edit-account-sheet"

export function getAccountKind(account: Account) {
  return account.institutionName ?? accountTypeLabels[account.type]
}

/** How a transaction moved this account's balance: a transfer out also pays its fee. */
function getAccountAmount(transaction: Transaction, accountId: string) {
  if (transaction.kind !== "transfer") return transaction.amount
  return transaction.fromAccountId === accountId
    ? -(transaction.amount + (transaction.fee ?? 0))
    : transaction.amount
}

type AccountSheetProps = {
  /** The account to show; none closes the sheet. */
  account?: Account
  share?: { percentageLabel: string }
  transactions: Transaction[]
  /** For the transactions' category icons. */
  categoryGroups: CategoryGroup[]
  onOpenChange: (open: boolean) => void
}

export function AccountSheet({ account, share, transactions, categoryGroups, onOpenChange }: AccountSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  // Keeps the last account on screen while the sheet slides closed.
  const [shown, setShown] = React.useState(account)
  if (account && account !== shown) setShown(account)

  if (!shown) return null

  const isLocked = shown.status === "archived"

  const handleArchivedChange = () => {
    startTransition(async () => {
      try {
        const result = await setAccountArchivedAction(shown.id, !isLocked)

        if (result.success) {
          toast.success(isLocked ? "Đã dùng lại tài khoản" : "Đã ngừng sử dụng tài khoản")
          return
        }

        toast.error(result.error)
      } catch {
        toast.error("Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.")
      }
    })
  }

  return (
    <>
      <Sheet open={account !== undefined} onOpenChange={onOpenChange}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title={shown.name} />
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pt-px pb-4">
            <div className="px-3">
              <p className="text-sm text-muted-foreground">
                Số dư
              </p>
              <p
                className={cn(
                  "font-heading text-3xl leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]",
                  shown.balance < 0 && "text-[#c8393a] dark:text-[#ff9b93]",
                )}
              >
                {formatCurrency(shown.balance)}
              </p>
            </div>

            <SettingsGroup>
              {/* "Ngân hàng: Vietcombank", or just the type for cash. */}
              <SettingsRow
                title={shown.institutionName ? accountTypeLabels[shown.type] : "Loại"}
                value={shown.institutionName ?? accountTypeLabels[shown.type]}
              />
              <SettingsRow title="Số dư ban đầu" value={formatCurrency(shown.openingBalance)} />
              {share ? <SettingsRow title="Tỉ trọng" value={share.percentageLabel} /> : null}
              {shown.note ? <SettingsRow title="Ghi chú" description={shown.note} /> : null}
            </SettingsGroup>

            <SettingsGroup title="Giao dịch gần đây">
              {transactions.length > 0 ? (
                <>
                  {transactions.map((transaction) => {
                    // The category's icon, as in the transactions list.
                    const { icon, color } = getTransactionVisual(transaction, categoryGroups)
                    const amount = getAccountAmount(transaction, shown.id)

                    return (
                      <SettingsRow
                        key={transaction.id}
                        icon={icon}
                        color={color}
                        title={transaction.title}
                        description={`${formatShortDate(toDateKey(transaction.occurredAt))} · ${formatTime(transaction.occurredAt)}`}
                        value={formatCurrency(amount, { signDisplay: "always" })}
                      />
                    )
                  })}
                  <SettingsRow
                    title="Xem tất cả"
                    onClick={() => router.push(`/transactions?account=${encodeURIComponent(shown.id)}`)}
                  />
                </>
              ) : (
                <SettingsRow title="Chưa có giao dịch" />
              )}
            </SettingsGroup>

            <SettingsGroup>
              <SettingsRow
                title="Chỉnh sửa"
                disabled={isLocked || isPending}
                onClick={() => setEditOpen(true)}
              />
              <SettingsRow
                title={isLocked ? "Tiếp tục sử dụng" : "Ngừng sử dụng"}
                chevron={false}
                disabled={isPending}
                onClick={handleArchivedChange}
              />
            </SettingsGroup>
            <SettingsGroup>
              <SettingsRow
                destructive
                title="Xoá tài khoản"
                disabled={isPending}
                onClick={() => setDeleteOpen(true)}
              />
            </SettingsGroup>
          </div>
        </SheetContent>
      </Sheet>
      <EditAccountSheet account={shown} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteAccountAlert
        account={shown}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirmed={() => onOpenChange(false)}
      />
    </>
  )
}
