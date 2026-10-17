import { formatCurrency } from "@/lib/format-currency"
import { formatShortDate, toDateKey } from "@/lib/format-date"
import { scheduleUndoableDelete } from "@/lib/undoable-delete"

import { deleteTransactionAction } from "../actions"
import type { Transaction } from "../_types/transaction"

/** The key a transaction's delete goes by, which the list leaves out while it is pending. */
export const transactionDeleteKey = (id: string) => `transaction:${id}`

/**
 * Deletes a transaction after six seconds with an undo, no confirmation
 * first. The toast names it with its amount and day, as several may share
 * a category ("Ăn trưa").
 */
export function deleteTransactionWithUndo(transaction: Transaction) {
  const signed = transaction.kind === "expense" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount)
  scheduleUndoableDelete({
    key: transactionDeleteKey(transaction.id),
    title: `Đã xoá “${transaction.title}”`,
    description: `${formatCurrency(signed, { signDisplay: transaction.kind === "transfer" ? "never" : "always" })} · ${formatShortDate(toDateKey(transaction.occurredAt))}`,
    pendingMessage: "Đang xoá giao dịch…",
    undoMessage: "Đã giữ lại giao dịch.",
    errorMessage: "Không thể xoá giao dịch. Vui lòng thử lại.",
    onCommit: async () => {
      const result = await deleteTransactionAction(transaction.id)

      if (!result.success) throw new Error(result.error)
    },
  })
}
