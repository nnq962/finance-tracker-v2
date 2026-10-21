import "server-only"

import { sql } from "kysely"

import type { SessionUser } from "@/lib/auth/session"
import { getDb } from "@/lib/db/client"
import { getFirebaseAdminMessaging } from "@/lib/firebase/admin"
import { PUSH_ICONS } from "@/lib/notifications/types"
import { isAdmin } from "@/lib/plans/admin"
import { debtsUrl } from "@/lib/debts/debts-url"

import {
  BROADCAST_BODY_MAX,
  BROADCAST_TITLE_MAX,
  broadcastAudiences,
  broadcastDestinations,
  type BroadcastAudience,
  type BroadcastChannel,
  type BroadcastInput,
  type BroadcastItem,
  type BroadcastOpens,
  type BroadcastReach,
  type BroadcastScreenData,
} from "./types"

export class BroadcastError extends Error {}

/** How far ahead a broadcast may be set. */
const MAX_AHEAD_DAYS = 60
/** Bell notices: the history shows this many. */
const HISTORY_LIMIT = 50

/** The page a push opens for each destination (the bell opens the same, or the sheet itself). */
const pushUrls: Record<BroadcastOpens, string> = {
  none: "/overview",
  overview: "/overview",
  transactions: "/transactions",
  budget: "/budget",
  debts: debtsUrl(),
  budgets: "/overview?screen=budgets",
  plans: "/overview?screen=plan",
  release: "/settings?screen=releases",
}

export const broadcastPushUrl = (opens: BroadcastOpens) => pushUrls[opens]

/** Only admins send; checked here too, whatever the caller did. */
function assertAdmin(user: SessionUser) {
  if (!isAdmin(user)) throw new BroadcastError("Chỉ quản trị viên được gửi thông báo.")
}

/** The input checked and trimmed, or a BroadcastError saying what is wrong. */
export function parseBroadcastInput(input: unknown, now = new Date()): BroadcastInput {
  const value = (input ?? {}) as Record<string, unknown>
  const title = typeof value.title === "string" ? value.title.trim() : ""
  const body = typeof value.body === "string" ? value.body.trim() : ""
  if (!title) throw new BroadcastError("Nhập tiêu đề.")
  if (title.length > BROADCAST_TITLE_MAX) throw new BroadcastError(`Tiêu đề tối đa ${BROADCAST_TITLE_MAX} ký tự.`)
  if (!body) throw new BroadcastError("Nhập nội dung.")
  if (body.length > BROADCAST_BODY_MAX) throw new BroadcastError(`Nội dung tối đa ${BROADCAST_BODY_MAX} ký tự.`)
  const opens = broadcastDestinations.find((item) => item.value === value.opens)?.value
  if (!opens) throw new BroadcastError("Nơi mở không hợp lệ.")
  const channel = value.channel
  if (channel !== "both" && channel !== "bell" && channel !== "push") throw new BroadcastError("Kênh không hợp lệ.")
  const audience = broadcastAudiences.find((item) => item === value.audience)
  if (!audience) throw new BroadcastError("Người nhận không hợp lệ.")
  let sendAt: string | null = null
  if (value.sendAt !== null && value.sendAt !== undefined) {
    const at = typeof value.sendAt === "string" ? new Date(value.sendAt) : new Date(Number.NaN)
    if (Number.isNaN(at.getTime())) throw new BroadcastError("Thời điểm gửi không hợp lệ.")
    if (at.getTime() <= now.getTime()) throw new BroadcastError("Giờ hẹn đã qua, chọn giờ sau bây giờ.")
    if (at.getTime() > now.getTime() + MAX_AHEAD_DAYS * 86_400_000) throw new BroadcastError(`Chỉ hẹn trong ${MAX_AHEAD_DAYS} ngày tới.`)
    sendAt = at.toISOString()
  }
  return { title, body, opens, channel, audience, sendAt }
}

/** Each audience as it stands now: its people, the devices a push reaches, those who turned pushes off. */
export async function getBroadcastReach(): Promise<Record<BroadcastAudience, BroadcastReach>> {
  const rows = await Promise.all(
    broadcastAudiences.map(async (audience) => {
      const { rows } = await sql<{ people: string; devices: string; optedOut: string }>`
        WITH audience AS (SELECT id FROM broadcast_audience(${audience}, now()) AS a (id))
        SELECT
          (SELECT count(*) FROM audience) AS people,
          (SELECT count(*) FROM push_devices d
            JOIN notification_browsers nb ON nb.id = d.browser_id AND nb.user_id = d.user_id AND nb.device_id = d.id
            WHERE d.user_id IN (SELECT id FROM audience)
              AND NOT EXISTS (SELECT 1 FROM notification_settings s WHERE s.user_id = d.user_id AND NOT s.broadcasts_enabled)
          ) AS devices,
          (SELECT count(*) FROM notification_settings s
            WHERE s.user_id IN (SELECT id FROM audience) AND NOT s.broadcasts_enabled) AS "optedOut"
      `.execute(getDb())
      const row = rows[0]
      return [audience, { people: Number(row.people), devices: Number(row.devices), optedOut: Number(row.optedOut) }] as const
    }),
  )
  return Object.fromEntries(rows) as Record<BroadcastAudience, BroadcastReach>
}

/**
 * Writes a broadcast down. Sent now, its recipients and pushes are written at
 * once (release_broadcast), so it is in their bells straight away; the worker
 * pushes it. Set for later, the worker sends it then. Returns its id.
 */
export async function createBroadcast(admin: SessionUser, input: unknown) {
  assertAdmin(admin)
  const values = parseBroadcastInput(input)
  return getDb().transaction().execute(async (trx) => {
    const row = await trx
      .insertInto("broadcasts")
      .values({
        title: values.title,
        body: values.body,
        opens: values.opens,
        pushUrl: broadcastPushUrl(values.opens),
        inBell: values.channel !== "push",
        push: values.channel !== "bell",
        audience: values.audience,
        sendAt: values.sendAt ? new Date(values.sendAt) : sql<Date>`now()`,
        createdBy: admin.uid,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    if (!values.sendAt) await sql`SELECT release_broadcast(${row.id}::uuid)`.execute(trx)
    return row.id
  })
}

/**
 * Takes a broadcast back. One still set for later is deleted, nothing having
 * gone out; one sent leaves every bell and its pushes not yet out are
 * dropped (those on devices stay). Returns which it was.
 */
export async function revokeBroadcast(admin: SessionUser, id: string): Promise<"cancelled" | "revoked"> {
  assertAdmin(admin)
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new BroadcastError("Thông báo không hợp lệ.")
  return getDb().transaction().execute(async (trx) => {
    const row = await trx
      .selectFrom("broadcasts")
      .select(["status", "revokedAt"])
      .where("id", "=", id)
      .forUpdate()
      .executeTakeFirst()
    if (!row) throw new BroadcastError("Không tìm thấy thông báo.")
    if (row.status === "scheduled") {
      await trx.deleteFrom("broadcasts").where("id", "=", id).execute()
      return "cancelled"
    }
    if (row.revokedAt) return "revoked"
    await trx
      .updateTable("broadcasts")
      .set({ revokedAt: sql`now()`, status: "sent", attemptId: null, leaseUntil: null })
      .where("id", "=", id)
      .execute()
    await trx
      .updateTable("broadcastDeliveries")
      .set({ status: "skipped", retryAt: null, updatedAt: sql`now()` })
      .where("broadcastId", "=", id)
      .where("status", "in", ["pending", "retry"])
      .execute()
    return "revoked"
  })
}

const channelOf = (row: { inBell: boolean; push: boolean }): BroadcastChannel =>
  row.inBell && row.push ? "both" : row.inBell ? "bell" : "push"

/** The latest broadcasts with how each went, newest first, those still set for later on top. */
export async function getBroadcasts(): Promise<BroadcastItem[]> {
  const rows = await getDb()
    .selectFrom("broadcasts as b")
    .select((eb) => [
      "b.id",
      "b.title",
      "b.body",
      "b.opens",
      "b.inBell",
      "b.push",
      "b.audience",
      "b.sendAt",
      "b.status",
      "b.revokedAt",
      eb.selectFrom("broadcastRecipients as r").select((e) => e.fn.countAll<string>().as("n")).whereRef("r.broadcastId", "=", "b.id").as("people"),
      eb
        .selectFrom("noticeReads as n")
        .innerJoin("broadcastRecipients as r", (join) => join.onRef("r.userId", "=", "n.userId").onRef("r.broadcastId", "=", "b.id"))
        .select((e) => e.fn.countAll<string>().as("n"))
        .where("n.key", "=", sql<string>`'broadcast:' || b.id`)
        .as("read"),
      sql<Record<string, number> | null>`(
        SELECT json_object_agg(status, n) FROM (
          SELECT status, count(*) AS n FROM broadcast_deliveries d WHERE d.broadcast_id = b.id GROUP BY status
        ) counts
      )`.as("deliveries"),
    ])
    .orderBy(sql`b.status = 'scheduled'`, "desc")
    .orderBy("b.sendAt", "desc")
    .limit(HISTORY_LIMIT)
    .execute()

  return rows.map((row) => {
    const counts = row.deliveries ?? {}
    const of = (status: string) => Number(counts[status] ?? 0)
    const pending = of("pending") + of("retry")
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      opens: row.opens as BroadcastOpens,
      channel: channelOf(row),
      audience: row.audience as BroadcastAudience,
      sendAt: row.sendAt.toISOString(),
      status: row.revokedAt ? "revoked" : (row.status as "scheduled" | "sending" | "sent"),
      revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
      people: Number(row.people ?? 0),
      devices: {
        sent: of("sent"),
        failed: of("failed"),
        removed: of("unregistered"),
        pending,
        total: of("sent") + of("failed") + of("unregistered") + pending,
      },
      read: Number(row.read ?? 0),
    }
  })
}

export async function getBroadcastScreenData(): Promise<BroadcastScreenData> {
  const [items, reach] = await Promise.all([getBroadcasts(), getBroadcastReach()])
  return { items, reach }
}

/** Sends a push; the default goes through FCM, tests pass their own. */
export type PushSender = (messages: { fid: string; title: string; body: string; url: string }[]) => Promise<number>

const fcmSender: PushSender = async (messages) => {
  const result = await getFirebaseAdminMessaging().sendEach(
    messages.map((message) => ({
      fid: message.fid,
      notification: { title: message.title, body: message.body },
      data: { type: "broadcast-test", url: message.url },
      webpush: { headers: { TTL: "600" }, notification: { tag: "broadcast-test", ...PUSH_ICONS } },
    })),
  )
  return result.successCount
}

/**
 * Pushes the draft to the admin's own linked devices only, to see it as
 * users will; nothing is written down. Returns how many devices took it.
 */
export async function sendTestBroadcast(admin: SessionUser, input: unknown, send: PushSender = fcmSender) {
  assertAdmin(admin)
  const values = parseBroadcastInput({ ...(input as object), sendAt: null })
  const devices = await getDb()
    .selectFrom("pushDevices as d")
    .innerJoin("notificationBrowsers as b", "b.id", "d.browserId")
    .select("d.fid")
    .where("d.userId", "=", admin.uid)
    .where("b.userId", "=", admin.uid)
    .whereRef("b.deviceId", "=", "d.id")
    .execute()
  if (devices.length === 0) throw new BroadcastError("Máy của bạn chưa bật thông báo đẩy.")
  const url = broadcastPushUrl(values.opens)
  return send(devices.map((device) => ({ fid: device.fid, title: values.title, body: values.body, url })))
}

/** Turns "Tin từ Timi" pushes on or off for a user; the bell shows them either way. */
export async function setBroadcastsEnabled(userId: string, enabled: boolean) {
  await getDb()
    .insertInto("notificationSettings")
    .values({ userId, broadcastsEnabled: enabled })
    .onConflict((conflict) => conflict.column("userId").doUpdateSet({ broadcastsEnabled: enabled }))
    .execute()
}

/** The broadcasts in a user's bell: sent to them, not taken back, from the last 30 days. */
export async function getBellBroadcasts(userId: string, since: Date) {
  return getDb()
    .selectFrom("broadcasts as b")
    .innerJoin("broadcastRecipients as r", "r.broadcastId", "b.id")
    .select(["b.id", "b.title", "b.body", "b.opens", "b.sendAt"])
    .where("r.userId", "=", userId)
    .where("b.inBell", "=", true)
    .where("b.revokedAt", "is", null)
    .where("b.sendAt", ">=", since)
    .execute()
}
