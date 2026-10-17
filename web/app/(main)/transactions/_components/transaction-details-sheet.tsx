"use client"

import * as React from "react"
import { ArrowRightIcon, CopyIcon, PencilIcon, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryItem } from "@/lib/categories/types"
import { formatLongDate, formatShortDate, formatTime, toDateKey } from "@/lib/format-date"

import { setTransactionExcludedAction } from "../actions"
import type { Transaction } from "../_types/transaction"
import { useTransactionHistory } from "./add-transaction/transaction-history-context"
import { deleteTransactionWithUndo } from "./delete-transaction"
import { ExcludedRow } from "./excluded-row"

type TransactionDetailsSheetProps = {
  accounts: Account[]
  category?: CategoryItem
  /** The transaction's icon and colour, as its row in the list shows them. */
  icon: LucideIcon
  tone: CategoryColorName
  onCopy: () => void
  onDeleted: () => void
  onEdit: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  transaction: Transaction
}

/** How many earlier transactions of the same category the sheet lists. */
const RECENT_COUNT = 3

/** An account's logo and name, as the end of a row or a side of a transfer. */
function AccountMark({ account, name, size = "xs" }: { account?: Account; name?: string; size?: "xs" | "sm" }) {
  const label = account?.name ?? name ?? "Không xác định"
  return (
    <>
      {account ? <AccountLogo account={account} size={size} /> : null}
      <span className="min-w-0 truncate">{label}</span>
    </>
  )
}

/**
 * A transaction as a receipt: its icon, title, amount and when, then what it
 * is, label on the left and value on the right (the account with its logo,
 * the category with its icon, its group; a transfer as its two accounts side
 * by side, its fee and what left the first one), the note in full, the
 * category's last few transactions to compare with, and a way to write it
 * down again. Edit is the pencil in the bar, and deleting is in the editor;
 * a balance correction, which has no editor, is deleted here, last, with an
 * undo. A loan's movement opens on the debts page instead.
 */
export function TransactionDetailsSheet({
  accounts,
  category,
  icon,
  tone,
  onCopy,
  onDeleted,
  onEdit,
  onOpenChange,
  open,
  transaction,
}: TransactionDetailsSheetProps) {
  const router = useRouter()
  const isDebt = transaction.source === "debt"
  const isTransfer = transaction.kind === "transfer"
  // A balance corrected by hand: no category, deleted rather than edited or copied.
  const isAdjustment = Boolean(transaction.adjustment)
  const occurredAt = new Date(transaction.occurredAt)
  const accountById = new Map(accounts.map((account) => [account.id, account]))

  // The same category's latest others, newest first, from what the page has loaded.
  const history = useTransactionHistory(transaction.kind, transaction.id)
  const recent = transaction.categoryId
    ? history.filter((item) => item.categoryId === transaction.categoryId).slice(0, RECENT_COUNT)
    : []

  // A correction only (others are deleted from the editor); six seconds with an undo, no confirmation.
  const handleDelete = () => {
    onDeleted()
    deleteTransactionWithUndo(transaction)
  }

  const fee = transaction.fee ?? 0

  // Switched here at once; the page catches up as the server saves it, and
  // a failure switches it back.
  const [excluded, setExcluded] = React.useState(Boolean(transaction.excluded))
  const [savedExcluded, setSavedExcluded] = React.useState(Boolean(transaction.excluded))
  if (Boolean(transaction.excluded) !== savedExcluded) {
    setSavedExcluded(Boolean(transaction.excluded))
    setExcluded(Boolean(transaction.excluded))
  }
  const changeExcluded = async (next: boolean) => {
    setExcluded(next)
    const result = await setTransactionExcludedAction(transaction.id, next)
    if (!result.success) {
      setExcluded(!next)
      toast.error(result.error)
    }
  }

  return (
    <PageSheet
      title="Chi tiết giao dịch"
      open={open}
      onOpenChange={onOpenChange}
      className="gap-6"
      action={
        isDebt || isAdjustment ? null : (
          <Button type="button" variant="secondary" size="icon" aria-label="Sửa giao dịch" onClick={onEdit}>
            <PencilIcon />
          </Button>
        )
      }
    >
      <div className="flex flex-col items-center pt-2 text-center">
        <IconTile icon={icon} tone={tone} size="lg" />
        <p className="mt-3 text-base text-muted-foreground">{transaction.title}</p>
        {/* Signed as in the list, so spending and income read apart without colour. */}
        <Money
          amount={transaction.kind === "expense" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount)}
          sign={isTransfer ? "never" : "always"}
          size="xl"
          tone={transaction.kind === "income" ? "income" : "default"}
        />
        <time className="mt-1 text-sm text-muted-foreground" dateTime={transaction.occurredAt}>
          {formatLongDate(toDateKey(occurredAt))} · {formatTime(occurredAt)}
        </time>
      </div>

      {isTransfer ? (
        <>
          {/* Where the money went, the two accounts side by side. */}
          <Card size="lg" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-5 text-center">
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              {accountById.get(transaction.fromAccountId ?? "") ? (
                <AccountLogo account={accountById.get(transaction.fromAccountId ?? "")!} />
              ) : null}
              <span className="text-xs text-muted-foreground">Từ</span>
              <span className="w-full truncate text-sm font-medium">{transaction.fromAccountName ?? "Không xác định"}</span>
            </div>
            <ArrowRightIcon className="size-5 text-muted-foreground" aria-label="sang" />
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              {accountById.get(transaction.toAccountId ?? "") ? (
                <AccountLogo account={accountById.get(transaction.toAccountId ?? "")!} />
              ) : null}
              <span className="text-xs text-muted-foreground">Đến</span>
              <span className="w-full truncate text-sm font-medium">{transaction.toAccountName ?? "Không xác định"}</span>
            </div>
          </Card>
          {fee > 0 || transaction.note ? (
            <SettingsGroup>
              {fee > 0 ? (
                <>
                  <SettingsRow title="Phí chuyển khoản" value={<Money amount={fee} sign="never" size="sm" tone="muted" />} />
                  {/* The fee leaves the first account along with the amount. */}
                  <SettingsRow
                    title="Tổng trừ"
                    value={<Money amount={Math.abs(transaction.amount) + fee} sign="never" size="sm" />}
                  />
                </>
              ) : null}
              {transaction.note ? (
                <SettingsRow
                  title="Ghi chú"
                  description={<span className="whitespace-pre-wrap select-text">{transaction.note}</span>}
                  fullDescription
                />
              ) : null}
            </SettingsGroup>
          ) : null}
        </>
      ) : (
        <SettingsGroup>
          <SettingsRow
            title="Tài khoản"
            value={
              <span className="flex min-w-0 items-center gap-2">
                <AccountMark account={accountById.get(transaction.accountId ?? "")} name={transaction.accountName} />
              </span>
            }
          />
          {/* A loan, or a correction, is named in the title above. */}
          {isDebt || isAdjustment ? null : (
            <>
              <SettingsRow
                title="Hạng mục"
                value={
                  <span className="flex min-w-0 items-center gap-2">
                    {category ? <IconTile icon={icon} tone={tone} size="xs" /> : null}
                    <span className="min-w-0 truncate">{transaction.categoryName ?? "Không xác định"}</span>
                  </span>
                }
              />
              {transaction.categoryGroupName ? <SettingsRow title="Nhóm" value={transaction.categoryGroupName} /> : null}
            </>
          )}
          {transaction.note ? (
            <SettingsRow
              title="Ghi chú"
              description={<span className="whitespace-pre-wrap select-text">{transaction.note}</span>}
              fullDescription
            />
          ) : null}
        </SettingsGroup>
      )}

      {/* Income and spending only: transfers and loans are never in the figures. */}
      {isDebt || isTransfer ? null : (
        <SettingsGroup>
          <ExcludedRow
            kind={transaction.kind === "income" ? "income" : "expense"}
            accountName={transaction.accountName}
            checked={excluded}
            onCheckedChange={changeExcluded}
            byAccount={transaction.accountExcluded}
          />
        </SettingsGroup>
      )}

      {recent.length > 0 ? (
        <SettingsGroup title={`${transaction.categoryName} gần đây`}>
          {recent.map((item) => (
            <SettingsRow
              key={item.id}
              title={formatShortDate(toDateKey(item.occurredAt))}
              description={item.note || undefined}
              value={
                <Money
                  amount={item.kind === "expense" ? -Math.abs(item.amount) : Math.abs(item.amount)}
                  sign="always"
                  size="sm"
                  tone={item.kind === "income" ? "income" : "default"}
                />
              }
            />
          ))}
        </SettingsGroup>
      ) : null}

      {isDebt ? (
        // A loan is changed on the debts page.
        <SettingsGroup>
          <SettingsRow
            title="Mở trong Vay nợ"
            onClick={() => router.push(`/debts?debt=${encodeURIComponent(transaction.debtId ?? "")}`)}
          />
        </SettingsGroup>
      ) : (
        <>
          {isAdjustment ? (
            <SettingsGroup footer="Xoá để đưa số dư về như trước khi điều chỉnh.">
              <SettingsRow destructive title="Xoá giao dịch" onClick={handleDelete} />
            </SettingsGroup>
          ) : (
            <SettingsGroup>
              <SettingsRow icon={CopyIcon} title="Ghi lại giao dịch này" description="Điền sẵn, ngày là hôm nay" onClick={onCopy} />
            </SettingsGroup>
          )}
        </>
      )}
    </PageSheet>
  )
}
