import type { TransactionKind } from "../_types/transaction"

/** A transaction as the assistant understood it; any part may still be missing. */
export type AiTransactionDraft = {
  kind: TransactionKind
  amount: number | null
  /** Detail the category does not say ("Ở quán cô Ba"); empty when none was given. */
  note: string
  categoryId?: string
  /**
   * With no category that fits, the one the assistant suggests creating: in
   * the group `groupId`, or in a new group `groupName` when there is none.
   */
  suggestedCategory?: { name: string; groupName: string; groupId?: string }
  accountId?: string
  /** The receiving account of a transfer. */
  toAccountId?: string
  /** "YYYY-MM-DD" */
  date: string
  /** "HH:mm", 24-hour */
  time: string
}

/** The day `days` after (or before) a "YYYY-MM-DD" key. */
export function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
