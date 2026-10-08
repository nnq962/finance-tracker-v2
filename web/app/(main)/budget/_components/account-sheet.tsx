"use client"

import * as React from "react"
import { ArchiveIcon, ArchiveRestoreIcon, ArrowDownLeftIcon, ArrowUpRightIcon, PencilIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { FlowTiles } from "@/components/app/flow-tiles"
import { Money } from "@/components/app/money"
import { PageSheet } from "@/components/app/page-sheet"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { accountDescription } from "@/lib/accounts/labels"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatDate, formatShortDate, toDateKey } from "@/lib/format-date"
import type { AccountFlow, Transaction } from "@/lib/transactions/types"

import { TransactionHistoryProvider } from "../../transactions/_components/add-transaction/transaction-history-context"
import { TransactionItem } from "../../transactions/_components/transaction-item"
import { setAccountArchivedAction } from "../actions"
import { DeleteAccountAlert } from "./account-actions/delete-account-alert"
import { EditAccountSheet } from "./account-actions/edit-account-sheet"

/** How a transaction moved this account's balance: a transfer out also pays its fee. */
function getAccountAmount(transaction: Transaction, accountId: string) {
  if (transaction.kind !== "transfer") return transaction.amount
  return transaction.fromAccountId === accountId
    ? -(transaction.amount + (transaction.fee ?? 0))
    : transaction.amount
}

/** What a transaction was, the account going without saying: a transfer's other end, else its category's group. */
function getAccountDescription(transaction: Transaction, accountId: string) {
  if (transaction.kind === "transfer") {
    return transaction.fromAccountId === accountId
      ? `Đến ${transaction.toAccountName ?? "tài khoản khác"}`
      : `Từ ${transaction.fromAccountName ?? "tài khoản khác"}`
  }
  return transaction.categoryGroupName
}

type AccountSheetProps = {
  /** The account to show; none closes the sheet. */
  account?: Account
  /** Every account, for the transactions' sheets. */
  accounts: Account[]
  /** Its latest transactions. */
  transactions: Transaction[]
  /** What came in and went out this month. */
  flow?: AccountFlow
  /** The month `flow` covers, e.g. "Tháng 10". */
  monthLabel: string
  /** For the transactions' category icons. */
  categoryGroups: CategoryGroup[]
  onOpenChange: (open: boolean) => void
}

/**
 * An account as the transaction's sheet shows one: its logo, name, balance
 * and kind at the top, edited from the pencil in the bar; this month's money
 * in and out; when it started, what it started with and how much it has
 * moved since; its latest transactions, each opening its own sheet; then
 * putting it away (said what it does) and deleting it.
 */
export function AccountSheet({
  account,
  accounts,
  transactions,
  flow,
  monthLabel,
  categoryGroups,
  onOpenChange,
}: AccountSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  // Keeps the last account on screen while the sheet slides closed.
  const [shown, setShown] = React.useState(account)
  if (account && account !== shown) setShown(account)

  if (!shown) return null

  const isLocked = shown.status === "archived"
  const change = shown.balance - shown.openingBalance
  const subtitle = [accountDescription(shown), isLocked ? "Đã ngừng sử dụng" : undefined].filter(Boolean).join(" · ")

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
      <PageSheet
        title="Chi tiết tài khoản"
        open={account !== undefined}
        onOpenChange={onOpenChange}
        className="gap-6"
        action={
          // An account put away is not edited; using it again brings the pencil back.
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label="Sửa tài khoản"
            disabled={isLocked || isPending}
            onClick={() => setEditOpen(true)}
          >
            <PencilIcon />
          </Button>
        }
      >
        <div className="flex flex-col items-center pt-2 text-center">
          <AccountLogo account={shown} size="lg" />
          <p className="mt-3 max-w-full truncate text-base text-muted-foreground">{shown.name}</p>
          <Money
            amount={shown.balance}
            size="xl"
            tone={isLocked ? "muted" : shown.balance < 0 ? "expense" : "default"}
          />
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        {/* The month's figures as on the transactions page, under a caption like a group's. */}
        <section aria-label={`${monthLabel}: tiền vào và ra`} className="flex flex-col gap-2">
          <h3 className={`px-4 ${groupCaptionClassName}`}>{monthLabel}</h3>
          <FlowTiles
            tiles={[
              {
                value: "in",
                label: "Tiền vào",
                amount: flow?.moneyIn ?? 0,
                caption: flow?.inCount ? `${flow.inCount} giao dịch` : "Chưa có",
                icon: ArrowDownLeftIcon,
                tone: "income",
              },
              {
                value: "out",
                label: "Tiền ra",
                amount: flow?.moneyOut ?? 0,
                caption: flow?.outCount ? `${flow.outCount} giao dịch` : "Chưa có",
                icon: ArrowUpRightIcon,
                tone: "expense",
              },
            ]}
          />
        </section>

        <SettingsGroup>
          <SettingsRow title="Bắt đầu từ" value={formatDate(toDateKey(shown.openedAt))} />
          <SettingsRow title="Số dư ban đầu" value={<Money amount={shown.openingBalance} size="sm" tone="muted" />} />
          <SettingsRow
            title={change > 0 ? "Đã tăng" : change < 0 ? "Đã giảm" : "Thay đổi"}
            value={
              change === 0 ? (
                "Chưa đổi"
              ) : (
                <Money amount={change} sign="always" size="sm" tone={change > 0 ? "income" : "default"} />
              )
            }
          />
          {shown.note ? (
            <SettingsRow title="Ghi chú" description={<span className="select-text">{shown.note}</span>} fullDescription />
          ) : null}
        </SettingsGroup>

        <SettingsGroup title="Giao dịch gần đây">
          {transactions.length > 0 ? (
            // What the transactions' sheets compare with and learn quick picks from.
            <TransactionHistoryProvider transactions={transactions}>
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  accounts={accounts}
                  categoryGroups={categoryGroups}
                  transaction={transaction}
                  description={getAccountDescription(transaction, shown.id)}
                  amount={getAccountAmount(transaction, shown.id)}
                  dateLabel={formatShortDate(toDateKey(transaction.occurredAt))}
                />
              ))}
              <SettingsRow
                title="Xem tất cả"
                onClick={() => router.push(`/transactions?account=${encodeURIComponent(shown.id)}`)}
              />
            </TransactionHistoryProvider>
          ) : (
            <SettingsRow title="Chưa có giao dịch" />
          )}
        </SettingsGroup>

        <SettingsGroup
          footer={
            isLocked
              ? "Dùng lại thì tài khoản trở lại danh sách chọn khi ghi giao dịch và được tính vào tổng số dư."
              : "Ẩn khỏi danh sách chọn khi ghi giao dịch và không tính vào tổng số dư. Số dư và lịch sử vẫn giữ, dùng lại lúc nào cũng được."
          }
        >
          <SettingsRow
            icon={isLocked ? ArchiveRestoreIcon : ArchiveIcon}
            title={isLocked ? "Dùng lại tài khoản" : "Ngừng sử dụng"}
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
      </PageSheet>
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
