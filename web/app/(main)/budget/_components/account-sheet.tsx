"use client"

import * as React from "react"
import { ArrowDownLeftIcon, ArrowUpRightIcon, Repeat2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import type { Transaction } from "@/lib/transactions/types"

import { setAccountArchivedAction } from "../actions"
import { DeleteAccountAlert } from "./account-actions/delete-account-alert"
import { EditAccountSheet } from "./account-actions/edit-account-sheet"

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})
const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
})

/** "02/10 · 10:16" */
function formatDateTime(value: string) {
  const date = new Date(value)
  // vi-VN joins day and month with "-"; build "02/10" from the parts.
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return `${parts.day}/${parts.month} · ${timeFormatter.format(date)}`
}

const accountTypeLabels = {
  cash: "Tiền mặt",
  bank: "Ngân hàng",
  "e-wallet": "Ví điện tử",
} as const

const kindRows = {
  expense: { icon: ArrowUpRightIcon, color: "rose" },
  income: { icon: ArrowDownLeftIcon, color: "emerald" },
  transfer: { icon: Repeat2Icon, color: "blue" },
} as const

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
  onOpenChange: (open: boolean) => void
}

export function AccountSheet({ account, share, transactions, onOpenChange }: AccountSheetProps) {
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
          toast.success(isLocked ? "Đã kích hoạt lại tài khoản." : "Đã ngừng sử dụng tài khoản.")
          router.refresh()
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
                {isLocked ? "Số dư đã khoá" : "Số dư hiện tại"}
              </p>
              <p className="font-heading text-3xl leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]">
                {formatCurrency(shown.balance)}
              </p>
            </div>

            <SettingsGroup>
              <SettingsRow title="Loại" value={accountTypeLabels[shown.type]} />
              {shown.institutionName ? (
                <SettingsRow
                  title={shown.type === "bank" ? "Ngân hàng" : "Ví"}
                  value={shown.institutionName}
                />
              ) : null}
              <SettingsRow title="Số dư ban đầu" value={formatCurrency(shown.openingBalance)} />
              {share ? <SettingsRow title="Tỉ trọng" value={share.percentageLabel} /> : null}
              <SettingsRow title="Ghi chú" description={shown.note || undefined} value={shown.note ? undefined : "—"} />
            </SettingsGroup>

            <SettingsGroup title="Giao dịch gần đây">
              {transactions.length > 0 ? (
                <>
                  {transactions.map((transaction) => {
                    const row = kindRows[transaction.kind]
                    const amount = getAccountAmount(transaction, shown.id)

                    return (
                      <SettingsRow
                        key={transaction.id}
                        icon={row.icon}
                        color={row.color}
                        title={transaction.title}
                        description={formatDateTime(transaction.occurredAt)}
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
                description={isLocked ? "Tiếp tục sử dụng để chỉnh sửa." : undefined}
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
      <DeleteAccountAlert account={shown} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}
