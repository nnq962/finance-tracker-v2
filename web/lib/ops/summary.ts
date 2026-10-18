import "server-only"

import { statfs } from "node:fs/promises"
import { sql } from "kysely"

import { getDb } from "@/lib/db/client"
import { formatCurrency } from "@/lib/format-currency"
import { formatShortDate, toDateKey } from "@/lib/format-date"
import { getMonthTakings } from "@/lib/plans/repository"

import { serverErrorsToday } from "./errors"

const VN = "Asia/Ho_Chi_Minh"
// The start of today in Vietnam time, as a timestamp.
const dayStart = sql<Date>`(date_trunc('day', now() at time zone ${VN}) at time zone ${VN})`

const count = (value: unknown) => Number(value ?? 0)

/** How full the disk the app runs on is, in percent; null if unknown. */
async function diskUsedPercent() {
  try {
    const stats = await statfs("/")
    return Math.round((1 - stats.bavail / stats.blocks) * 100)
  } catch {
    return null
  }
}

/**
 * The day in numbers for the admin's Telegram (sent each evening by the
 * watcher, deploy/watcher): users, who wrote something, Pro sales, coupons,
 * AI, server errors, the disk, the version. Counts only, nobody named.
 */
export async function buildOpsSummary() {
  const db = getDb()
  const [users, activity, paidToday, paidMonth, proNow, coupons, ai, disk] = await Promise.all([
    db
      .selectFrom("users")
      .select([sql<number>`count(*)`.as("total"), sql<number>`count(*) filter (where created_at >= ${dayStart})`.as("today")])
      .executeTakeFirst(),
    db
      .selectFrom("transactions")
      .select([sql<number>`count(*)`.as("rows"), sql<number>`count(distinct user_id)`.as("people")])
      .where(sql<boolean>`created_at >= ${dayStart}`)
      .executeTakeFirst(),
    // Takings as the admin screen counts them (getMonthTakings): what each Pro
    // grant brought in (payOS's amount received, or a grant by hand with its
    // amount), revoked ones left out. An order's price is not what came in
    // (2026-10-18: a test order at 29.000đ had received nothing).
    db
      .selectFrom("subscriptions")
      .select([sql<number>`count(*) filter (where amount > 0)`.as("n"), sql<number>`coalesce(sum(amount), 0)`.as("sum")])
      .where("revokedAt", "is", null)
      .where(sql<boolean>`created_at >= ${dayStart}`)
      .executeTakeFirst(),
    getMonthTakings().then((takings) => ({ sum: takings.total })),
    db
      .selectFrom("subscriptions")
      .select(sql<number>`count(distinct user_id)`.as("n"))
      .where("revokedAt", "is", null)
      .where(sql<boolean>`starts_at <= now() and ends_at > now()`)
      .executeTakeFirst(),
    db
      .selectFrom("couponRedemptions")
      .select(sql<number>`count(*)`.as("n"))
      .where(sql<boolean>`created_at >= ${dayStart}`)
      .executeTakeFirst(),
    db
      .selectFrom("aiUsage")
      .select(sql<number>`coalesce(sum(count), 0)`.as("n"))
      .where(sql<boolean>`month = date_trunc('month', now() at time zone ${VN})::date`)
      .executeTakeFirst(),
    diskUsedPercent(),
  ])

  const date = formatShortDate(toDateKey(new Date()))
  const errors = serverErrorsToday()
  const lines = [
    `📊 <b>Timi hôm nay (${date})</b>`,
    `👤 Người dùng: ${count(users?.total)} (+${count(users?.today)} mới)`,
    `✍️ Hoạt động: ${count(activity?.people)} người ghi ${count(activity?.rows)} giao dịch`,
    `💰 Doanh thu: hôm nay ${formatCurrency(count(paidToday?.sum))} (${count(paidToday?.n)} lượt) · tháng này ${formatCurrency(count(paidMonth?.sum))}`,
    `👑 Đang dùng Pro: ${count(proNow?.n)} người`,
    `🎟 Mã giảm giá dùng hôm nay: ${count(coupons?.n)}`,
    `🤖 Lượt AI tháng này: ${count(ai?.n)}`,
    `${errors ? "⚠️" : "✅"} Lỗi server hôm nay: ${errors}`,
    disk === null ? "💽 Ổ đĩa: không đọc được" : `${disk >= 90 ? "🚨" : "💽"} Ổ đĩa: ${disk}% đã dùng`,
    `🏷 Bản ${process.env.NEXT_PUBLIC_APP_VERSION}`,
  ]
  return lines.join("\n")
}
