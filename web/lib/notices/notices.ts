import "server-only"

import { getAccounts } from "@/lib/accounts/repository"
import { getBellBroadcasts } from "@/lib/broadcasts/repository"
import type { BroadcastOpens } from "@/lib/broadcasts/types"
import { appEvents } from "@/lib/app-events"
import { getPaymentMetrics } from "@/lib/debts/calculations"
import { getContacts, getDebts } from "@/lib/debts/repository"
import { getDb } from "@/lib/db/client"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { MISSION_REWARD, missionKeys, missionTitles } from "@/lib/onboarding/missions"
import { getMissionState } from "@/lib/onboarding/repository"
import { getPlanState } from "@/lib/plans/repository"
import { releaseLevel, releases } from "@/lib/releases"

import type { Notice } from "./types"

/** How close a due date (or a Pro end) has to be before it is said. */
const DEBT_DAYS = 3
const PRO_DAYS = 7
/** How long a new version is announced. */
const RELEASE_DAYS = 14
/** How long a broadcast stays in the bell. */
const BROADCAST_DAYS = 30

const DAY_MS = 86_400_000

/** A moment on a Vietnam day, at a Vietnam clock time. */
const at = (dateKey: string, time: string) => new Date(`${dateKey}T${time}:00+07:00`).toISOString()

/** Days from one "YYYY-MM-DD" to another. */
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)

/** What a tap on a broadcast opens, as the bell does it. */
function broadcastOpens(opens: BroadcastOpens): Notice["opens"] {
  switch (opens) {
    case "none":
      return undefined
    case "budgets":
      return { href: "/overview?screen=budgets" }
    case "plans":
      return { event: appEvents.openPlans }
    case "release":
      return releases[0] ? { release: releases[0].version } : undefined
    default:
      return { href: `/${opens}` }
  }
}

const shiftDay = (dateKey: string, days: number) => toDateKey(new Date(Date.parse(`${dateKey}T12:00:00+07:00`) + days * DAY_MS))

/**
 * The user's notices, newest first, worked out from their data as asked for:
 * debts due within three days or overdue, yesterday left unwritten, mission
 * rewards to claim, AI requests running low, Pro ending, accounts below
 * zero, the latest version that brought something new, for two weeks, and
 * what the admin sent them (broadcasts), for a month. Broadcasts aside,
 * nothing is stored but which have been read (notice_reads), each by a key
 * naming the thing and its moment, so a new moment ("quá hạn" after "sắp đến hạn") is new again.
 */
export async function getNotices(userId: string): Promise<Notice[]> {
  const today = toDateKey(new Date())
  const yesterday = shiftDay(today, -1)
  const month = today.slice(0, 7)
  const db = getDb()
  const [debts, contacts, accounts, missions, plan, reads, recorded, broadcasts] = await Promise.all([
    getDebts(userId),
    getContacts(userId),
    getAccounts(userId),
    getMissionState(userId),
    getPlanState(userId),
    db.selectFrom("noticeReads").select("key").where("userId", "=", userId).execute(),
    // Anything written down yesterday, and whether there was an account before it.
    db
      .selectFrom("transactions")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("userId", "=", userId)
      .where("occurredAt", ">=", new Date(`${yesterday}T00:00:00+07:00`))
      .where("occurredAt", "<", new Date(`${today}T00:00:00+07:00`))
      .executeTakeFirstOrThrow(),
    getBellBroadcasts(userId, new Date(Date.now() - BROADCAST_DAYS * DAY_MS)),
  ])
  const notices: Omit<Notice, "read">[] = []
  const names = new Map(contacts.map((contact) => [contact.id, contact.name]))

  // Debts due within a few days, or past due, both ways.
  for (const debt of debts) {
    if (debt.status === "settled" || !debt.dueAt) continue
    const left = daysBetween(today, debt.dueAt)
    if (left > DEBT_DAYS) continue
    const remaining = getPaymentMetrics(debt, today).remainingAmount
    if (remaining <= 0) continue
    const who = names.get(debt.contactId) ?? "Người liên hệ"
    const side = debt.direction === "lent" ? "cần thu" : "cần trả"
    const overdue = left < 0
    notices.push({
      key: `debt:${debt.id}:${debt.dueAt}:${overdue ? "overdue" : "due"}`,
      kind: overdue ? "debt-overdue" : "debt-due",
      title: overdue ? "Quá hạn" : "Sắp đến hạn",
      body: `${who} · ${side} ${formatCurrency(remaining)} · ${
        overdue ? `quá hạn ${-left} ngày` : left === 0 ? "đến hạn hôm nay" : `còn ${left} ngày`
      }`,
      at: overdue ? at(debt.dueAt, "08:00") : at(shiftDay(debt.dueAt, -Math.min(DEBT_DAYS, Math.max(0, daysBetween(debt.recordedAt, debt.dueAt)))), "08:00"),
      opens: { href: `/debts?debt=${encodeURIComponent(debt.id)}` },
    })
  }

  // Yesterday left unwritten, once there was an account to write it in.
  const hadAccount = accounts.some((account) => toDateKey(account.openedAt) < today)
  if (hadAccount && Number(recorded.count) === 0) {
    notices.push({
      key: `unrecorded:${yesterday}`,
      kind: "unrecorded",
      title: "Chưa ghi chi tiêu",
      body: "Hôm qua bạn chưa ghi khoản nào",
      at: at(today, "07:00"),
      opens: { event: appEvents.addTransaction },
    })
  }

  // Mission rewards waiting (the browser-only one, installing, is claimed where it is seen).
  const waiting = missionKeys.filter((key) => missions.done[key] && !missions.claimed.includes(key))
  if (waiting.length > 0) {
    notices.push({
      key: `missions:${waiting.join(",")}`,
      kind: "missions",
      title: `+${waiting.length * MISSION_REWARD} lượt AI chờ nhận`,
      body: waiting.length === 1 ? `Nhiệm vụ: ${missionTitles[waiting[0]]}` : `${waiting.length} nhiệm vụ đã xong, nhận thưởng ở Tổng quan`,
      at: at(today, "07:00"),
      opens: { href: "/overview" },
    })
  }

  // AI requests running low this month, credits counted.
  const left = Math.max(0, plan.aiLimit - plan.aiUsed) + plan.aiCredits
  if (left <= 3) {
    notices.push({
      key: `ai:${month}:${left === 0 ? "out" : "low"}`,
      kind: "ai",
      title: left === 0 ? "Đã hết lượt AI" : `Còn ${left} lượt AI`,
      body: plan.plan === "pro" ? "Lượt mới có từ đầu tháng sau" : "Nâng cấp Pro hoặc làm nhiệm vụ để có thêm",
      at: at(today, "07:00"),
      opens: { event: appEvents.openPlans },
    })
  }

  // Pro ending within a week.
  if (plan.proEndsAt) {
    const end = toDateKey(plan.proEndsAt)
    const days = daysBetween(today, end)
    if (days >= 0 && days <= PRO_DAYS) {
      notices.push({
        key: `pro:${end}`,
        kind: "pro",
        title: days === 0 ? "Gói Pro hết hạn hôm nay" : `Gói Pro còn ${days} ngày`,
        body: `Dùng đến hết ${formatDate(end)}, gia hạn để giữ ${plan.aiLimit} lượt AI mỗi tháng`,
        at: at(shiftDay(end, -PRO_DAYS) > today ? today : shiftDay(end, -PRO_DAYS), "07:00"),
        opens: { event: appEvents.openPlans },
      })
    }
  }

  // Accounts in use below zero, said once a month while they stay so.
  for (const account of accounts) {
    if (account.status !== "active" || account.balance >= 0) continue
    notices.push({
      key: `negative:${account.id}:${month}`,
      kind: "negative",
      title: "Tài khoản đang âm",
      body: `${account.name} · ${formatCurrency(account.balance)}`,
      at: at(today, "07:00"),
      opens: { href: `/budget?account=${encodeURIComponent(account.id)}` },
    })
  }

  // The latest version with something new (fixes come too often to announce), for two weeks.
  const latest = releases.find((_, index) => releaseLevel(index) !== "patch")
  if (latest && daysBetween(latest.date, today) <= RELEASE_DAYS) {
    notices.push({
      key: `release:${latest.version}`,
      kind: "release",
      title: `Có gì mới ở bản ${latest.version}`,
      body: latest.title,
      at: at(latest.date, "09:00"),
      opens: { release: latest.version },
    })
  }

  // What the admin sent ("Tin từ Timi"), for a month.
  for (const broadcast of broadcasts) {
    notices.push({
      key: `broadcast:${broadcast.id}`,
      kind: "broadcast",
      title: broadcast.title,
      body: broadcast.body,
      at: broadcast.sendAt.toISOString(),
      opens: broadcastOpens(broadcast.opens as BroadcastOpens),
    })
  }

  const read = new Set(reads.map((row) => row.key))
  return notices
    .map((notice) => ({ ...notice, read: read.has(notice.key) }))
    .sort((left, right) => right.at.localeCompare(left.at))
}

/** Marks notices read (from a tap, or "all read"); reading one twice changes nothing. */
export async function markNoticesRead(userId: string, keys: string[]) {
  const valid = [...new Set(keys)].filter((key) => typeof key === "string" && key.length >= 1 && key.length <= 200)
  if (valid.length === 0) return
  await getDb()
    .insertInto("noticeReads")
    .values(valid.map((key) => ({ userId, key })))
    .onConflict((conflict) => conflict.columns(["userId", "key"]).doNothing())
    .execute()
}
