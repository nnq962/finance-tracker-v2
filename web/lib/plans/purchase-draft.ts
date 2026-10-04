import "server-only"

import { createHash } from "node:crypto"

import type { SessionUser } from "@/lib/auth/session"
import { getDb } from "@/lib/db/client"
import { isUuid } from "@/lib/db/ids"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { isAdmin } from "@/lib/plans/admin"
import { proPrices } from "@/lib/plans/plans"

/** A Pro purchase ready to be written down as a transaction, the form filled in. */
export type PurchaseDraft = {
  kind: "expense" | "income"
  amount: number
  note: string
  /** When the money moved (ISO). */
  occurredAt: string
  /** The transaction's id, the same each time, so one purchase is written down once. */
  requestId: string
  /** Already written down. */
  recorded: boolean
}

/** A UUID fixed by the text, in the shape of a v4 one. */
function stableUuid(text: string) {
  const hex = createHash("sha256").update(text).digest("hex")
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

/**
 * A paid Pro grant as a transaction for whoever opens it: an expense for the
 * buyer, an income for an admin. Found by the payOS order the buyer came back
 * with, or by the grant an admin made; anything else, or a grant that cost
 * nothing, has no draft.
 */
export async function getPurchaseDraft(
  user: SessionUser,
  { order, grant }: { order?: string; grant?: string },
): Promise<PurchaseDraft | undefined> {
  const byOrder = Boolean(order && /^\d{1,15}$/.test(order))
  if (!byOrder && !isUuid(grant)) return undefined
  const db = getDb()
  const subscription = await db
    .selectFrom("subscriptions as s")
    .leftJoin("payments as p", "p.subscriptionId", "s.id")
    .select(["s.id", "s.userId", "s.amount", "s.startsAt", "s.endsAt", "s.createdAt"])
    .$if(byOrder, (query) => query.where("p.orderCode", "=", Number(order)))
    .$if(!byOrder, (query) => query.where("s.id", "=", grant!))
    .executeTakeFirst()
    .catch(() => undefined)
  if (!subscription || subscription.amount <= 0) return undefined

  const own = subscription.userId === user.uid
  if (!own && !isAdmin(user)) return undefined

  // A year runs twelve times a month's length; anything past two months reads as one.
  const days = (new Date(subscription.endsAt).getTime() - new Date(subscription.startsAt).getTime()) / 86_400_000
  const label = proPrices[days > 60 ? "year" : "month"].label
  let note = `Finance Tracker Pro ${label}`
  if (!own) {
    const buyer = await getFirebaseAdminAuth()
      .getUser(subscription.userId)
      .catch(() => undefined)
    note = `Bán Pro ${label}${buyer?.email ? ` · ${buyer.email}` : ""}`
  }

  const kind = own ? "expense" : "income"
  const requestId = stableUuid(`pro-${kind}:${subscription.id}`)
  const existing = await db
    .selectFrom("transactions")
    .select("id")
    .where("id", "=", requestId)
    .where("userId", "=", user.uid)
    .executeTakeFirst()

  return {
    kind,
    amount: subscription.amount,
    note,
    occurredAt: new Date(subscription.createdAt).toISOString(),
    requestId,
    recorded: Boolean(existing),
  }
}
