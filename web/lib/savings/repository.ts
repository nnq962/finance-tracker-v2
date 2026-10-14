import "server-only"

import { AccountValidationError } from "@/lib/accounts/validation"
import { lockAccounts } from "@/lib/db/accounts"
import { getDb } from "@/lib/db/client"
import { retryOnDeadlock } from "@/lib/db/retry"
import { randomId } from "@/lib/random-id"
import type { JarFormValues } from "@/lib/savings/validation"
import { deleteOne, insertTransaction } from "@/lib/transactions/repository"
import type { CashFlowTransactionValues } from "@/lib/transactions/types"
import { TransactionValidationError } from "@/lib/transactions/validation"

/**
 * Savings jars ("hũ tiết kiệm", 2026-10-14): accounts of type `savings`
 * holding money put aside for something to buy. Money goes in and out as
 * transfers (lib/transactions); what is here is what only a jar does.
 */

/** The request id becomes the jar's id, so a retried request adds nothing. It starts empty, opened now. */
export async function createJar(userId: string, values: JarFormValues, requestId: string) {
  const inserted = await getDb()
    .insertInto("accounts")
    .values({
      id: requestId,
      userId,
      name: values.name,
      type: "savings",
      openingBalance: 0,
      balance: 0,
      goalTarget: values.target,
      goalIcon: values.icon,
      goalDue: values.due ?? null,
    })
    .onConflict((conflict) => conflict.column("id").doNothing())
    .returning("id")
    .executeTakeFirst()

  if (!inserted) {
    const existing = await getDb().selectFrom("accounts").select("userId").where("id", "=", requestId).executeTakeFirst()
    if (existing?.userId !== userId) throw new AccountValidationError("Hũ không hợp lệ.")
  }
}

/** Its name, what it is for, the target and the due month; its money is moved only by transfers. */
export async function updateJar(userId: string, jarId: string, values: JarFormValues) {
  const result = await getDb()
    .updateTable("accounts")
    .set({ name: values.name, goalIcon: values.icon, goalTarget: values.target, goalDue: values.due ?? null })
    .where("id", "=", jarId)
    .where("userId", "=", userId)
    .where("type", "=", "savings")
    .executeTakeFirst()
  if (result.numUpdatedRows === BigInt(0)) throw new AccountValidationError("Không tìm thấy hũ. Vui lòng tải lại trang.")
}

/** A jar of the user's still being filled, else why not. */
export async function assertOpenJar(userId: string, jarId: string) {
  const jar = await getDb()
    .selectFrom("accounts")
    .select(["type", "completedAt"])
    .where("id", "=", jarId)
    .where("userId", "=", userId)
    .executeTakeFirst()
  if (!jar || jar.type !== "savings") throw new AccountValidationError("Không tìm thấy hũ. Vui lòng tải lại trang.")
  if (jar.completedAt) throw new AccountValidationError("Hũ này đã hoàn thành.")
}

/**
 * Bought what the jar was for: the price as an expense from the jar, in the
 * chosen category; what is left over goes to `otherAccountId`, or what is
 * missing comes from it first; then the jar is closed (archived, completed).
 * All or nothing. The request id becomes the expense's id, so a retry does
 * nothing a second time.
 */
export async function buyWithJar(
  userId: string,
  jarId: string,
  expense: CashFlowTransactionValues,
  otherAccountId: string | undefined,
  requestId: string,
) {
  await retryOnDeadlock(() =>
    getDb().transaction().execute(async (trx) => {
      const saved = await trx.selectFrom("transactions").select("userId").where("id", "=", requestId).executeTakeFirst()
      if (saved?.userId === userId) return

      const accounts = await lockAccounts(trx, userId, [jarId, ...(otherAccountId ? [otherAccountId] : [])])
      const jar = accounts.get(jarId)
      const row = await trx.selectFrom("accounts").select(["type", "completedAt"]).where("id", "=", jarId).executeTakeFirst()
      if (!jar || row?.type !== "savings") throw new AccountValidationError("Không tìm thấy hũ. Vui lòng tải lại trang.")
      if (row.completedAt) throw new AccountValidationError("Hũ này đã hoàn thành.")

      const rest = jar.balance - expense.amount
      if (rest !== 0 && !otherAccountId) {
        throw new TransactionValidationError(rest > 0 ? "Chọn tài khoản nhận phần thừa." : "Chọn tài khoản trả phần thiếu.")
      }
      const transfer = (amount: number, fromAccountId: string, toAccountId: string, note: string) =>
        insertTransaction(
          trx,
          userId,
          { kind: "transfer", amount, fee: 0, fromAccountId, toAccountId, occurredAt: expense.occurredAt, note },
          randomId(),
        )

      if (rest < 0) await transfer(-rest, otherAccountId!, jarId, "Phần thiếu khi mua")
      await insertTransaction(trx, userId, { ...expense, accountId: jarId }, requestId)
      if (rest > 0) await transfer(rest, jarId, otherAccountId!, "Phần thừa sau khi mua")

      await trx.updateTable("accounts").set({ status: "archived", completedAt: new Date() }).where("id", "=", jarId).execute()
    }),
  )
}

/**
 * Deletes a jar with every transaction in or out of it, each undone: the
 * money put in goes back to where it came from, and a purchase from it is
 * no longer spent. Refused when a loan used it, as deleting would change the loan.
 */
export async function deleteJar(userId: string, jarId: string) {
  await retryOnDeadlock(() =>
    getDb().transaction().execute(async (trx) => {
      const jar = (await lockAccounts(trx, userId, [jarId])).get(jarId)
      if (!jar) return
      const row = await trx.selectFrom("accounts").select("type").where("id", "=", jarId).executeTakeFirst()
      if (row?.type !== "savings") throw new AccountValidationError("Không tìm thấy hũ. Vui lòng tải lại trang.")

      const [loanMoves, loans, payments] = await Promise.all([
        trx
          .selectFrom("transactions")
          .select("id")
          .where("userId", "=", userId)
          .where("debtId", "is not", null)
          .where((eb) => eb.or([eb("accountId", "=", jarId), eb("fromAccountId", "=", jarId), eb("toAccountId", "=", jarId)]))
          .executeTakeFirst(),
        trx.selectFrom("debts").select("id").where("userId", "=", userId).where("accountId", "=", jarId).executeTakeFirst(),
        trx.selectFrom("debtPayments").select("id").where("userId", "=", userId).where("accountId", "=", jarId).executeTakeFirst(),
      ])
      if (loanMoves || loans || payments) throw new AccountValidationError("Hũ đã dùng cho vay nợ nên không xoá được.")

      // Opened again for the moment, so its money can move back.
      await trx.updateTable("accounts").set({ status: "active", completedAt: null }).where("id", "=", jarId).execute()
      const moves = await trx
        .selectFrom("transactions")
        .select("id")
        .where("userId", "=", userId)
        .where((eb) => eb.or([eb("accountId", "=", jarId), eb("fromAccountId", "=", jarId), eb("toAccountId", "=", jarId)]))
        .execute()
      for (const move of moves) await deleteOne(trx, userId, move.id)
      await trx.deleteFrom("accounts").where("id", "=", jarId).execute()
    }),
  )
}
