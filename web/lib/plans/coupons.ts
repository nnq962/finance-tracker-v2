import "server-only"

import { sql, type Kysely, type Transaction } from "kysely"

import { getDb } from "@/lib/db/client"
import type { DB } from "@/lib/db/types"
import { MIN_CHECKOUT_AMOUNT, priceWithCoupon, type PlanPeriod } from "@/lib/plans/plans"
import { insertGrant, PlanError } from "@/lib/plans/repository"

/** Who grants Pro taken free with a coupon, in place of an admin's id. */
export const COUPON_GRANTOR = "coupon"

export type Coupon = { id: string; code: string; percentOff: number }

/** Codes are kept upper case without spaces, and typed in any case. */
export function normalizeCouponCode(input: unknown) {
  return typeof input === "string" ? input.replace(/\s+/g, "").toUpperCase() : ""
}

/**
 * The coupon a user can use now, or a PlanError saying why not. With
 * `forUpdate` inside a transaction, the coupon row is locked so uses at the
 * same moment are counted one after another.
 */
export async function findUsableCoupon(
  db: Kysely<DB> | Transaction<DB>,
  userId: string,
  input: unknown,
  { forUpdate = false } = {},
): Promise<Coupon> {
  const code = normalizeCouponCode(input)
  if (!/^[A-Z0-9]{3,20}$/.test(code)) throw new PlanError("Mã giảm giá không hợp lệ.")

  const coupon = await db
    .selectFrom("coupons")
    .select(["id", "code", "percentOff", "expiresAt", "maxRedemptions", "active"])
    .where("code", "=", code)
    .$if(forUpdate, (query) => query.forUpdate())
    .executeTakeFirst()
  if (!coupon || !coupon.active) throw new PlanError("Mã giảm giá không hợp lệ.")
  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) throw new PlanError("Mã giảm giá đã hết hạn.")

  const [used, mine] = await Promise.all([
    coupon.maxRedemptions
      ? db
          .selectFrom("couponRedemptions")
          .select((eb) => eb.fn.countAll<number>().as("count"))
          .where("couponId", "=", coupon.id)
          .executeTakeFirstOrThrow()
      : undefined,
    db
      .selectFrom("couponRedemptions")
      .select("id")
      .where("couponId", "=", coupon.id)
      .where("userId", "=", userId)
      .executeTakeFirst(),
  ])
  if (mine) throw new PlanError("Bạn đã dùng mã này.")
  if (coupon.maxRedemptions && used && Number(used.count) >= coupon.maxRedemptions) {
    throw new PlanError("Mã giảm giá đã hết lượt.")
  }
  return { id: coupon.id, code: coupon.code, percentOff: coupon.percentOff }
}

/**
 * Counts a use of a coupon for the grant it led to. A user who paid twice
 * with one code (two checkouts open at once) keeps both grants; the use is
 * counted once.
 */
export async function recordRedemption(
  trx: Transaction<DB>,
  { couponId, userId, subscriptionId }: { couponId: string; userId: string; subscriptionId: string },
) {
  await trx
    .insertInto("couponRedemptions")
    .values({ couponId, userId, subscriptionId })
    .onConflict((conflict) => conflict.columns(["couponId", "userId"]).doNothing())
    .execute()
}

/**
 * Grants Pro for a period at once, for a code that leaves (next to) nothing
 * to pay. The coupon is locked and checked again, so its last use cannot be
 * taken twice.
 */
export async function grantWithCoupon(userId: string, period: PlanPeriod, input: unknown) {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const coupon = await findUsableCoupon(trx, userId, input, { forUpdate: true })
      const { amount } = priceWithCoupon(period, coupon.percentOff)
      if (amount >= MIN_CHECKOUT_AMOUNT) throw new PlanError("Mã này cần thanh toán phần còn lại.")
      const subscriptionId = await insertGrant(trx, userId, {
        period,
        amount: 0,
        note: `Mã ${coupon.code}`,
        grantedBy: COUPON_GRANTOR,
      })
      await recordRedemption(trx, { couponId: coupon.id, userId, subscriptionId })
      return coupon
    })
}

export type AdminCoupon = {
  id: string
  code: string
  percentOff: number
  expiresAt?: string
  maxRedemptions?: number
  active: boolean
  used: number
}

/** Every coupon with how often it was used, newest first. */
export async function listCouponsForAdmin(): Promise<AdminCoupon[]> {
  const rows = await getDb()
    .selectFrom("coupons as c")
    .select(["c.id", "c.code", "c.percentOff", "c.expiresAt", "c.maxRedemptions", "c.active"])
    .select((eb) =>
      eb
        .selectFrom("couponRedemptions as r")
        .select((inner) => inner.fn.countAll<number>().as("count"))
        .whereRef("r.couponId", "=", "c.id")
        .as("used"),
    )
    .orderBy("c.createdAt", "desc")
    .execute()
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    percentOff: row.percentOff,
    ...(row.expiresAt ? { expiresAt: new Date(row.expiresAt).toISOString() } : {}),
    ...(row.maxRedemptions ? { maxRedemptions: row.maxRedemptions } : {}),
    active: row.active,
    used: Number(row.used ?? 0),
  }))
}

/** A new code, made by an admin. */
export async function createCoupon(
  adminId: string,
  values: { code: unknown; percentOff: unknown; maxRedemptions?: unknown; expiresOn?: unknown },
) {
  const code = normalizeCouponCode(values.code)
  if (!/^[A-Z0-9]{3,20}$/.test(code)) throw new PlanError("Mã gồm 3–20 chữ cái hoặc số, không dấu.")
  const percentOff = values.percentOff
  if (typeof percentOff !== "number" || !Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    throw new PlanError("Mức giảm từ 1 đến 100%.")
  }
  const max = values.maxRedemptions
  if (max !== undefined && max !== null && (typeof max !== "number" || !Number.isInteger(max) || max < 1)) {
    throw new PlanError("Số lượt phải là số nguyên lớn hơn 0.")
  }
  const expiresOn = values.expiresOn
  if (expiresOn !== undefined && expiresOn !== "" && (typeof expiresOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn))) {
    throw new PlanError("Ngày hết hạn không hợp lệ.")
  }
  const inserted = await getDb()
    .insertInto("coupons")
    .values({
      code,
      percentOff,
      maxRedemptions: typeof max === "number" ? max : null,
      // To the end of that day in Vietnam.
      expiresAt: typeof expiresOn === "string" && expiresOn ? sql<Date>`(${expiresOn}::date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'` : null,
      createdBy: adminId,
    })
    .onConflict((conflict) => conflict.column("code").doNothing())
    .returning("id")
    .executeTakeFirst()
  if (!inserted) throw new PlanError("Mã này đã tồn tại.")
}

/** Turns a code on or off; uses already made stay. */
export async function setCouponActive(couponId: string, active: boolean) {
  await getDb().updateTable("coupons").set({ active }).where("id", "=", couponId).execute()
}
