import "server-only"

import type { Transaction } from "kysely"

import type { DB } from "@/lib/db/types"

import { MAX_MONEY } from "@/lib/money"

export { MAX_MONEY }

export type LockedAccount = {
  id: string
  name: string
  balance: number
  status: string
}

/**
 * Locks the given accounts of a user until the database transaction ends, so
 * concurrent balance changes queue instead of overwriting each other. Rows are
 * locked in id order to avoid deadlocks. Missing ids are absent from the map.
 */
export async function lockAccounts(
  trx: Transaction<DB>,
  userId: string,
  accountIds: Iterable<string>,
) {
  const ids = [...new Set(accountIds)].sort()
  const accounts = new Map<string, LockedAccount>()

  if (ids.length === 0) return accounts

  const rows = await trx
    .selectFrom("accounts")
    .select(["id", "name", "balance", "status"])
    .where("userId", "=", userId)
    .where("id", "in", ids)
    .orderBy("id")
    .forUpdate()
    .execute()

  rows.forEach((row) => accounts.set(row.id, row))
  return accounts
}

/** Balance after applying delta, or null when it leaves 0..MAX_MONEY. */
export function shiftBalance(balance: number, delta: number) {
  const next = balance + delta
  return Number.isSafeInteger(next) && next >= 0 && next <= MAX_MONEY
    ? next
    : null
}

export async function setBalance(
  trx: Transaction<DB>,
  accountId: string,
  balance: number,
) {
  await trx
    .updateTable("accounts")
    .set({ balance })
    .where("id", "=", accountId)
    .execute()
}
