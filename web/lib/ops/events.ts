import "server-only"

import { getDb } from "@/lib/db/client"
import { formatCurrency } from "@/lib/format-currency"
import { proPrices, type PlanPeriod } from "@/lib/plans/plans"

import { escapeHtml, notifyOps, opsEnabled } from "./telegram"

/** Someone signed in for the first time. */
export function noticeNewUser(email: string) {
  if (!opsEnabled()) return
  void getDb()
    .selectFrom("users")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirst()
    .then((row) => notifyOps(`👤 <b>Người dùng mới</b>: ${escapeHtml(email)}\nTổng: ${Number(row?.count ?? 0)} người dùng`))
    .catch(() => notifyOps(`👤 <b>Người dùng mới</b>: ${escapeHtml(email)}`))
}

const periodLabel = (period: string) => proPrices[period as PlanPeriod]?.label ?? period

/** Pro paid through payOS. */
export function noticeSaleToOps(sale: { email?: string; period: string; amount: number; discount?: number | null }) {
  const discount = sale.discount ? ` (giảm ${formatCurrency(sale.discount)})` : ""
  notifyOps(
    `💰 <b>Có người mua Pro</b>\n${escapeHtml(sale.email ?? "?")} · Pro ${escapeHtml(periodLabel(sale.period))} · ${formatCurrency(sale.amount)}${discount}`,
  )
}

/** Pro granted by a coupon that left nothing to pay. */
export function noticeCouponGrant(email: string, period: string, code: string, percentOff: number) {
  notifyOps(`🎟 <b>Dùng mã giảm giá</b>\n${escapeHtml(email)} · Pro ${escapeHtml(periodLabel(period))} · mã ${escapeHtml(code)} (−${percentOff}%)`)
}
