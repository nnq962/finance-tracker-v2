"use client"

import { useRouter } from "next/navigation"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { SheetContent } from "@/components/ui/sheet"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryItem } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatLongDate, formatTime, toDateKey } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"

import { deleteTransactionAction } from "../actions"
import { transactionPresentation } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"

type TransactionDetailsSheetProps = {
  category?: CategoryItem
  onDeleted: () => void
  onEdit: () => void
  transaction: Transaction
}

export function TransactionDetailsSheet({
  category,
  onDeleted,
  onEdit,
  transaction,
}: TransactionDetailsSheetProps) {
  const router = useRouter()
  const isDebt = transaction.source === "debt"
  const presentation = transactionPresentation[transaction.kind]
  const Icon = category
    ? categoryIconRegistry[category.iconName]
    : presentation.icon
  const categoryColor = category
    ? getCategoryColor(category.colorName)
    : undefined
  const occurredAt = new Date(transaction.occurredAt)
  const details =
    transaction.kind === "transfer"
      ? [
          {
            label: "Từ tài khoản",
            value: transaction.fromAccountName ?? "Không xác định",
          },
          {
            label: "Đến tài khoản",
            value: transaction.toAccountName ?? "Không xác định",
          },
          // A transfer without a fee does not mention one.
          ...(transaction.fee
            ? [
                {
                  label: "Phí chuyển khoản",
                  value: formatCurrency(transaction.fee, {
                    signDisplay: "never",
                  }),
                },
              ]
            : []),
        ]
      : [
          {
            label: "Tài khoản",
            value: transaction.accountName ?? "Không xác định",
          },
          // A loan is named in the title above; a category reads group › item.
          ...(isDebt
            ? []
            : [
                {
                  label: "Hạng mục",
                  value: [transaction.categoryGroupName, transaction.categoryName]
                    .filter(Boolean)
                    .join(" › ") || "Không xác định",
                },
              ]),
        ]

  // Deleting waits six seconds with an undo, so it needs no confirmation first.
  const handleDelete = () => {
    onDeleted()
    scheduleUndoableDelete({
      key: `transaction:${transaction.id}`,
      title: `Sắp xoá giao dịch ${transaction.title}`,
      description: "Giao dịch và tác động số dư sẽ bị xoá sau 6 giây.",
      pendingMessage: "Đang xoá giao dịch…",
      successMessage: "Đã xoá giao dịch.",
      undoMessage: "Đã giữ lại giao dịch.",
      errorMessage: "Không thể xoá giao dịch. Vui lòng thử lại.",
      onCommit: async () => {
        const result = await deleteTransactionAction(transaction.id)

        if (!result.success) throw new Error(result.error)
      },
    })
  }

  return (
    <SheetContent showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={(event) => event.preventDefault()} className="gap-0 data-[side=right]:w-full sm:max-w-md!">
      <SheetNavHeader title="Chi tiết giao dịch" />

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pt-px pb-4">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex size-16 items-center justify-center rounded-xl ${categoryColor?.surfaceClassName ?? presentation.iconClassName}`}
          >
            <Icon className="size-7" aria-hidden="true" />
          </div>
          <p
            className={`mt-5 text-[2rem] font-semibold tracking-tight tabular-nums ${presentation.amountClassName}`}
          >
            {/* Signed as in the list, so spending and income read apart without colour. */}
            {transaction.kind === "expense" ? "−" : transaction.kind === "income" ? "+" : ""}
            {formatCurrency(Math.abs(transaction.amount), {
              signDisplay: "never",
            })}
          </p>
          <p className="mt-3 text-base font-semibold">{transaction.title}</p>
          <time
            className="mt-1 text-sm text-muted-foreground"
            dateTime={transaction.occurredAt}
          >
            {formatLongDate(toDateKey(occurredAt))} · {formatTime(occurredAt)}
          </time>
        </div>

        <SettingsGroup>
          <SettingsRow title="Loại giao dịch" value={isDebt ? "Vay nợ" : presentation.label} />
          {details.map((detail) => (
            <SettingsRow key={detail.label} title={detail.label} value={detail.value} />
          ))}
          <SettingsRow
            title="Ghi chú"
            description={transaction.note ? <span className="whitespace-pre-wrap">{transaction.note}</span> : undefined}
            value={transaction.note ? undefined : "Không có"}
          />
        </SettingsGroup>

        {/* Edit and delete as rows at the end, like the other detail sheets. */}
        {isDebt ? (
          <SettingsGroup footer="Giao dịch này tạo từ một khoản vay nợ, nên được sửa hoặc xoá ở đó.">
            <SettingsRow
              title="Quản lý tại vay nợ"
              onClick={() => router.push(`/debts?debt=${encodeURIComponent(transaction.debtId ?? "")}`)}
            />
          </SettingsGroup>
        ) : (
          <>
            <SettingsGroup>
              <SettingsRow title="Sửa giao dịch" onClick={onEdit} />
            </SettingsGroup>
            <SettingsGroup>
              <SettingsRow destructive title="Xoá giao dịch" onClick={handleDelete} />
            </SettingsGroup>
          </>
        )}
      </div>
    </SheetContent>
  )
}
