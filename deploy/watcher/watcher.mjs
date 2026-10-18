// Timi's watcher (2026-10-18): runs on a machine other than the home server
// and reports to the admin's Telegram bot. Every minute it asks
// HEALTH_URL (/api/health through Cloudflare) and tells, from the answer,
// what is down: the database (503 from Timi), the web app (502/504 from
// Cloudflare), or the home server itself (530/1033: the tunnel lost it to a
// power or network cut, or cloudflared stopped). It says when Timi is back
// and for how long it was down, warns when answers turn slow, asks Timi for
// the evening summary at SUMMARY_AT, and answers /status, /summary and
// /help in the chat. No dependencies: Node's own fetch.

import { hostname } from "node:os"

const env = (name, fallback) => process.env[name] ?? fallback
const TOKEN = env("TELEGRAM_BOT_TOKEN")
const CHAT_ID = env("TELEGRAM_CHAT_ID")
const HEALTH_URL = env("HEALTH_URL", "https://timi.nnqlab.dev/api/health")
const SUMMARY_URL = env("SUMMARY_URL", "https://timi.nnqlab.dev/api/ops/summary")
const OPS_SECRET = env("OPS_SECRET", "")
const SUMMARY_AT = env("SUMMARY_AT", "21:00")
const CHECK_EVERY_MS = Number(env("CHECK_EVERY_SECONDS", "60")) * 1000
const FAIL_AFTER = Number(env("FAIL_AFTER", "2"))
// No answer at all (network, timeout) is often this machine's own path to
// Cloudflare losing packets in the evening (2026-10-18: 23% lost to Timi's
// Cloudflare address while Google and 1.1.1.1 lost none), not Timi: such a
// minute is tried twice more, and only NET_FAIL_AFTER of them in a row count.
const NET_FAIL_AFTER = Number(env("NET_FAIL_AFTER", "3"))
const NET_RETRIES = 2
const NET_RETRY_PAUSE_MS = 5000
const SLOW_MS = Number(env("SLOW_MS", "3000"))
const SLOW_AFTER = Number(env("SLOW_AFTER", "3"))
const REMIND_EVERY_MS = 30 * 60 * 1000
const TZ = "Asia/Ho_Chi_Minh"
// Answers when the watcher's own line works, to tell its outage from Timi's.
const CONTROL_URL = "https://www.gstatic.com/generate_204"

if (!TOKEN || !CHAT_ID) {
  console.error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.")
  process.exit(1)
}

const log = (...args) => console.log(new Date().toISOString(), ...args)
const clock = (date = new Date()) => date.toLocaleTimeString("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
const minutes = (ms) => (ms < 60_000 ? `${Math.round(ms / 1000)} giây` : `${Math.round(ms / 60_000)} phút`)
const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

async function telegram(method, body) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(method === "getUpdates" ? 65_000 : 10_000),
    })
    return await response.json()
  } catch (error) {
    log("telegram", method, "failed:", error.name)
    return null
  }
}

const send = (text, silent = false) =>
  telegram("sendMessage", { chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true, disable_notification: silent })

const REASONS = {
  database: "Database không trả lời (app web vẫn chạy).",
  web: "App web trên server không trả lời (container web có thể đã dừng).",
  tunnel: "Cloudflare không nối được tới server nhà: server mất điện, mất mạng, hoặc cloudflared đã dừng.",
  timeout: "Quá 15 giây không có phản hồi.",
  network: "Không gọi được tới Cloudflare.",
}
const reasonOf = (check) => REASONS[check.kind] ?? `Phản hồi lạ: HTTP ${check.code}.`

/** One look at HEALTH_URL: { kind: "ok" | "database" | "web" | "tunnel" | "timeout" | "network" | "http", code, ms, version }. */
async function check() {
  const started = Date.now()
  try {
    const response = await fetch(HEALTH_URL, {
      headers: { "Cache-Control": "no-cache", "User-Agent": "timi-watcher" },
      signal: AbortSignal.timeout(15_000),
    })
    const body = await response.text()
    const ms = Date.now() - started
    const code = response.status
    let json = null
    try {
      json = JSON.parse(body)
    } catch {}
    if (code === 200 && json?.status === "ok") return { kind: "ok", code, ms, version: json.version }
    if (code === 503 && json?.status === "database") return { kind: "database", code, ms }
    if (code === 530 || /error code:? ?1033|Argo Tunnel|Cloudflare Tunnel/i.test(body)) return { kind: "tunnel", code, ms }
    if ([502, 504, 520, 521, 522, 523, 524].includes(code)) return { kind: "web", code, ms }
    return { kind: "http", code, ms }
  } catch (error) {
    const ms = Date.now() - started
    return { kind: error.name === "TimeoutError" ? "timeout" : "network", code: 0, ms }
  }
}

async function ownLineWorks() {
  try {
    const response = await fetch(CONTROL_URL, { signal: AbortSignal.timeout(8000) })
    return response.status === 204
  } catch {
    return false
  }
}

const state = { down: false, since: 0, kind: "", fails: 0, slow: 0, slowWarned: false, lastReminder: 0, last: null, summaryDay: "" }

const noAnswer = (result) => result.kind === "network" || result.kind === "timeout"

/** A minute's look: a check, tried again (twice) while it gets no answer at all. */
async function look() {
  let result = await check()
  for (let attempt = 1; attempt <= NET_RETRIES && noAnswer(result); attempt += 1) {
    log("no answer, trying again:", result.kind, `${attempt}/${NET_RETRIES}`)
    await new Promise((resolve) => setTimeout(resolve, NET_RETRY_PAUSE_MS))
    result = await check()
  }
  return result
}

async function tick() {
  const result = await look()
  state.last = { ...result, at: new Date() }

  if (result.kind === "ok") {
    if (state.down) {
      const outage = Date.now() - state.since
      await send(`✅ <b>Timi đã hoạt động lại</b> sau ${minutes(outage)}.\nLúc trước: ${escape(REASONS[state.kind] ?? state.kind)}`)
      log("back up after", outage, "ms")
    }
    state.down = false
    state.fails = 0
    if (result.ms >= SLOW_MS) {
      state.slow += 1
      if (state.slow >= SLOW_AFTER && !state.slowWarned) {
        state.slowWarned = true
        await send(`🐢 <b>Timi phản hồi chậm</b>: ${(result.ms / 1000).toFixed(1)} giây (${state.slow} lần liên tiếp).`)
      }
    } else {
      if (state.slowWarned) await send(`🐇 Timi đã nhanh lại (${result.ms} ms).`, true)
      state.slow = 0
      state.slowWarned = false
    }
    return
  }

  // A failure: first make sure it is not this machine that lost its line.
  if (noAnswer(result) && !(await ownLineWorks())) {
    log("own line down, not counting:", result.kind)
    return
  }
  state.fails += 1
  // An error page from Cloudflare (530, 502…) is sure: FAIL_AFTER minutes; no answer: NET_FAIL_AFTER.
  const failAfter = noAnswer(result) ? NET_FAIL_AFTER : FAIL_AFTER
  log("failed:", result.kind, result.code, `${state.fails}/${failAfter}`)
  if (!state.down && state.fails >= failAfter) {
    state.down = true
    state.since = Date.now() - (failAfter - 1) * CHECK_EVERY_MS
    state.kind = result.kind
    state.lastReminder = Date.now()
    await send(`🔴 <b>Timi không vào được</b>\n${escape(reasonOf(result))}\nTừ khoảng ${clock(new Date(state.since))}.`)
    return
  }
  if (state.down && Date.now() - state.lastReminder >= REMIND_EVERY_MS) {
    state.lastReminder = Date.now()
    await send(`🔴 Timi vẫn chưa vào được (${minutes(Date.now() - state.since)}).\n${escape(reasonOf(result))}`)
  }
}

async function summary() {
  if (!OPS_SECRET) return send("Chưa đặt OPS_SECRET cho bot canh gác, nên không lấy được tóm tắt.")
  try {
    const response = await fetch(`${SUMMARY_URL}?send=1`, {
      headers: { Authorization: `Bearer ${OPS_SECRET}`, "User-Agent": "timi-watcher" },
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) await send(`Không lấy được tóm tắt: HTTP ${response.status}.`)
  } catch (error) {
    await send(`Không lấy được tóm tắt: ${escape(error.name)}.`)
  }
}

function statusText() {
  const last = state.last
  if (!last) return "Chưa kiểm tra lần nào."
  if (state.down) return `🔴 Timi đang không vào được (${minutes(Date.now() - state.since)}).\n${escape(REASONS[state.kind] ?? state.kind)}`
  if (last.kind !== "ok") return `🟡 Lần kiểm tra cuối (${clock(last.at)}) lỗi: ${escape(reasonOf(last))}`
  return `🟢 Timi đang chạy · phản hồi ${last.ms} ms · bản ${escape(last.version ?? "?")} · kiểm tra lúc ${clock(last.at)}`
}

async function commands() {
  let offset = 0
  for (;;) {
    const updates = await telegram("getUpdates", { offset, timeout: 50, allowed_updates: ["message"] })
    if (!updates?.ok) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      continue
    }
    for (const update of updates.result) {
      offset = update.update_id + 1
      const message = update.message
      // Only the admin's chat is answered.
      if (!message || String(message.chat.id) !== String(CHAT_ID)) continue
      const command = (message.text ?? "").trim().split(/[\s@]/)[0]
      if (command === "/status") await send(statusText())
      else if (command === "/summary") await summary()
      else if (command === "/start" || command === "/help")
        await send("Bot canh gác của Timi.\n/status: Timi có đang chạy không\n/summary: tóm tắt hôm nay\nTự báo khi Timi không vào được, khi chạy lại, khi chậm, và tóm tắt lúc " + SUMMARY_AT + ".")
    }
  }
}

function summaryDue() {
  const now = new Date()
  const day = now.toLocaleDateString("en-CA", { timeZone: TZ })
  const time = now.toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
  if (time >= SUMMARY_AT && state.summaryDay !== day) {
    state.summaryDay = day
    // Started after today's time: wait for tomorrow's rather than sending at once.
    return Boolean(state.started) && time < addMinutes(SUMMARY_AT, 30)
  }
  return false
}

function addMinutes(hhmm, minutesToAdd) {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + minutesToAdd
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

async function loop() {
  for (;;) {
    await tick().catch((error) => log("tick failed:", error))
    if (summaryDue()) await summary()
    state.started = true
    await new Promise((resolve) => setTimeout(resolve, CHECK_EVERY_MS))
  }
}

await telegram("setMyCommands", {
  commands: [
    { command: "status", description: "Timi có đang chạy không" },
    { command: "summary", description: "Tóm tắt hôm nay" },
    { command: "help", description: "Bot làm được gì" },
  ],
})
await send(`👀 Bot canh gác đã chạy trên <code>${escape(hostname())}</code>, kiểm tra Timi mỗi ${CHECK_EVERY_MS / 1000} giây.`, true)
log("watching", HEALTH_URL)
void commands()
await loop()
