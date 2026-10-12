import "server-only"

import { sql } from "kysely"

import { getDb } from "@/lib/db/client"

export type BalanceMismatch = {
  userId: string
  accountId: string
  name: string
  /** What the account says. */
  balance: number
  /** Its opening balance plus every movement recorded on it. */
  expected: number
}

/**
 * Every account whose stored balance is not its opening balance plus what
 * moved it: income and spending (loans' own movements and corrections
 * among them), both ends of transfers with the fee on the sender, and loan
 * repayments. The balance is kept as each change is saved, so a difference
 * means a bug or a hand-made change in the database. Checks, never fixes.
 */
export async function findBalanceMismatches(): Promise<{ checked: number; mismatches: BalanceMismatch[] }> {
  const db = getDb()
  const [{ rows }, counted] = await Promise.all([
    sql<{ userId: string; accountId: string; name: string; balance: string; expected: string }>`
      WITH moves (account_id, delta) AS (
        SELECT account_id, CASE kind WHEN 'income' THEN amount ELSE -amount END
        FROM transactions WHERE kind IN ('income', 'expense')
        UNION ALL
        SELECT from_account_id, -(amount + fee) FROM transactions WHERE kind = 'transfer'
        UNION ALL
        SELECT to_account_id, amount FROM transactions WHERE kind = 'transfer'
        UNION ALL
        SELECT p.account_id, CASE d.direction WHEN 'lent' THEN p.amount ELSE -p.amount END
        FROM debt_payments p JOIN debts d ON d.id = p.debt_id
      )
      SELECT a.user_id AS "userId", a.id AS "accountId", a.name, a.balance,
        a.opening_balance + coalesce(sum(m.delta), 0) AS expected
      FROM accounts a LEFT JOIN moves m ON m.account_id = a.id
      GROUP BY a.id
      HAVING a.balance <> a.opening_balance + coalesce(sum(m.delta), 0)
      ORDER BY a.user_id, a.name
    `.execute(db),
    db.selectFrom("accounts").select((eb) => eb.fn.countAll<string>().as("count")).executeTakeFirstOrThrow(),
  ])

  return {
    checked: Number(counted.count),
    mismatches: rows.map((row) => ({ ...row, balance: Number(row.balance), expected: Number(row.expected) })),
  }
}
