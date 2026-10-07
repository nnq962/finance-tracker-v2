import "server-only"

import { sql, type Transaction } from "kysely"

import { getDb } from "@/lib/db/client"
import type { DB } from "@/lib/db/types"
import { toDateKey } from "@/lib/format-date"
import { plans, proPrices, type PlanPeriod, type PlanState } from "@/lib/plans/plans"

export class PlanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlanError"
  }
}

/** The first day of the Vietnam calendar month, the key AI usage is counted under. */
function currentMonth() {
  return `${toDateKey(new Date()).slice(0, 7)}-01`
}

/**
 * When the user's Pro ends. Grants follow one another without gaps and a
 * revocation ends all that are left, so the latest end not revoked is it;
 * Pro is on while that is still to come.
 */
async function getProEndsAt(userId: string) {
  const row = await getDb()
    .selectFrom("subscriptions")
    .select((eb) => eb.fn.max("endsAt").as("endsAt"))
    .where("userId", "=", userId)
    .where("revokedAt", "is", null)
    .executeTakeFirst()
  const endsAt = row?.endsAt ? new Date(row.endsAt) : null
  return endsAt && endsAt > new Date() ? endsAt : null
}

export async function getPlanState(userId: string): Promise<PlanState> {
  const [proEndsAt, usage, user, rewards] = await Promise.all([
    getProEndsAt(userId),
    getDb()
      .selectFrom("aiUsage")
      .select("count")
      .where("userId", "=", userId)
      .where("month", "=", currentMonth())
      .executeTakeFirst(),
    getDb().selectFrom("users").select("aiCredits").where("id", "=", userId).executeTakeFirst(),
    getDb()
      .selectFrom("missionRewards")
      .select((eb) => eb.fn.coalesce(eb.fn.sum<number>("credits"), eb.lit(0)).as("earned"))
      .where("userId", "=", userId)
      .executeTakeFirst(),
  ])
  const plan = proEndsAt ? "pro" : "free"
  const aiCredits = user?.aiCredits ?? 0
  return {
    plan,
    ...(proEndsAt ? { proEndsAt: proEndsAt.toISOString() } : {}),
    aiUsed: usage?.count ?? 0,
    aiLimit: plans[plan].aiMonthlyLimit,
    aiCredits,
    // A refunded request can leave more than was earned.
    aiCreditsEarned: Math.max(Number(rewards?.earned ?? 0), aiCredits),
  }
}

export type AiReservation = {
  allowed: boolean
  used: number
  limit: number
  /** AI credits left (from missions). */
  credits: number
  /** What the request was taken from, to give it back to: the month's count, or a credit. */
  source: { month: string } | "credit" | null
}

/**
 * Counts one AI request against this month's limit, before it is made, or
 * once that is used up takes one of the user's AI credits. The count only
 * rises while under the limit, and credits only fall while some are left,
 * each in one statement, so requests at the same moment cannot pass either.
 */
export async function reserveAiRequest(userId: string): Promise<AiReservation> {
  const month = currentMonth()
  const limit = plans[(await getProEndsAt(userId)) ? "pro" : "free"].aiMonthlyLimit
  const result = await sql<{ count: number }>`
    INSERT INTO ai_usage (user_id, month, count) VALUES (${userId}, ${month}, 1)
    ON CONFLICT (user_id, month) DO UPDATE SET count = ai_usage.count + 1
    WHERE ai_usage.count < ${limit}
    RETURNING count
  `.execute(getDb())
  const counted = result.rows[0]?.count
  if (counted !== undefined) {
    const user = await getDb().selectFrom("users").select("aiCredits").where("id", "=", userId).executeTakeFirst()
    return { allowed: true, used: counted, limit, credits: user?.aiCredits ?? 0, source: { month } }
  }

  const credit = await getDb()
    .updateTable("users")
    .set((eb) => ({ aiCredits: eb("aiCredits", "-", 1) }))
    .where("id", "=", userId)
    .where("aiCredits", ">", 0)
    .returning("aiCredits")
    .executeTakeFirst()
  return credit
    ? { allowed: true, used: limit, limit, credits: credit.aiCredits, source: "credit" }
    : { allowed: false, used: limit, limit, credits: 0, source: null }
}

/** Gives back a request the AI could not answer, to where it was taken from. */
export async function releaseAiRequest(userId: string, source: AiReservation["source"]) {
  if (source === "credit") {
    await getDb()
      .updateTable("users")
      .set((eb) => ({ aiCredits: eb("aiCredits", "+", 1) }))
      .where("id", "=", userId)
      .execute()
  } else if (source) {
    await getDb()
      .updateTable("aiUsage")
      .set((eb) => ({ count: sql<number>`greatest(${eb.ref("count")} - 1, 0)` }))
      .where("userId", "=", userId)
      .where("month", "=", source.month)
      .execute()
  }
}

/**
 * Adds a grant of Pro inside `trx`, starting now or where the user's Pro
 * ends, and returns its id. The user's row is locked so two grants at once
 * still follow one another.
 */
export async function insertGrant(
  trx: Transaction<DB>,
  userId: string,
  { period, amount, note, grantedBy }: { period: PlanPeriod; amount: number; note?: string; grantedBy: string },
) {
  const user = await trx.selectFrom("users").select("id").where("id", "=", userId).forUpdate().executeTakeFirst()
  if (!user) throw new PlanError("Người dùng không tồn tại.")

  const last = await trx
    .selectFrom("subscriptions")
    .select((eb) => eb.fn.max("endsAt").as("endsAt"))
    .where("userId", "=", userId)
    .where("revokedAt", "is", null)
    .executeTakeFirst()
  const now = new Date()
  const startsAt = last?.endsAt && new Date(last.endsAt) > now ? new Date(last.endsAt) : now

  const { id } = await trx
    .insertInto("subscriptions")
    .values({
      userId,
      plan: "pro",
      startsAt,
      endsAt: sql<Date>`${startsAt}::timestamptz + make_interval(months => ${proPrices[period].months})`,
      amount,
      note: note || null,
      grantedBy,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  return id
}

/** Gives a user Pro for a period by hand, from an admin who saw the payment arrive. */
export async function grantPro(
  adminId: string,
  userId: string,
  { period, amount, note }: { period: PlanPeriod; amount: number; note?: string },
) {
  return getDb()
    .transaction()
    .execute((trx) => insertGrant(trx, userId, { period, amount, note, grantedBy: adminId }))
}

/** Ends a user's Pro now: every grant not yet over is revoked. */
export async function revokePro(userId: string) {
  await getDb()
    .updateTable("subscriptions")
    .set({ revokedAt: new Date() })
    .where("userId", "=", userId)
    .where("revokedAt", "is", null)
    .where("endsAt", ">", new Date())
    .execute()
}

export type AdminUserRow = {
  id: string
  createdAt: string
  proEndsAt?: string
  aiUsed: number
}

export type SubscriptionGrant = {
  id: string
  startsAt: string
  endsAt: string
  amount: number
  note?: string
  revoked: boolean
  createdAt: string
}

/** Every user with their Pro end and this month's AI requests, newest first. */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const month = currentMonth()
  const rows = await getDb()
    .selectFrom("users as u")
    .leftJoin("aiUsage as a", (join) => join.onRef("a.userId", "=", "u.id").on("a.month", "=", month))
    .select(["u.id", "u.createdAt", "a.count as aiUsed"])
    .select((eb) =>
      eb
        .selectFrom("subscriptions as s")
        .select((inner) => inner.fn.max("s.endsAt").as("endsAt"))
        .whereRef("s.userId", "=", "u.id")
        .where("s.revokedAt", "is", null)
        .as("proEndsAt"),
    )
    .orderBy("u.createdAt", "desc")
    .execute()
  const now = new Date()
  return rows.map((row) => ({
    id: row.id,
    createdAt: new Date(row.createdAt).toISOString(),
    ...(row.proEndsAt && new Date(row.proEndsAt) > now ? { proEndsAt: new Date(row.proEndsAt).toISOString() } : {}),
    aiUsed: row.aiUsed ?? 0,
  }))
}

/** A user's grants, newest first. */
export async function listGrants(userId: string): Promise<SubscriptionGrant[]> {
  const rows = await getDb()
    .selectFrom("subscriptions")
    .select(["id", "startsAt", "endsAt", "amount", "note", "revokedAt", "createdAt"])
    .where("userId", "=", userId)
    .orderBy("createdAt", "desc")
    .execute()
  return rows.map((row) => ({
    id: row.id,
    startsAt: new Date(row.startsAt).toISOString(),
    endsAt: new Date(row.endsAt).toISOString(),
    amount: row.amount,
    ...(row.note ? { note: row.note } : {}),
    revoked: row.revokedAt !== null,
    createdAt: new Date(row.createdAt).toISOString(),
  }))
}

/** What grants made this Vietnam month took in, not counting revoked ones. */
export async function getMonthTakings() {
  const row = await getDb()
    .selectFrom("subscriptions")
    .select((eb) => [eb.fn.coalesce(eb.fn.sum<number>("amount"), sql<number>`0`).as("total"), eb.fn.countAll<number>().as("count")])
    .where("revokedAt", "is", null)
    .where(sql<boolean>`date_trunc('month', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') = ${currentMonth()}::date`)
    .executeTakeFirstOrThrow()
  return { total: Number(row.total), count: Number(row.count) }
}
