import "server-only"

/*
 * The admin's Telegram bot (@timi_ops_bot, 2026-10-18): what happens in the
 * app (a new user, a Pro sale, server errors, the evening summary) goes to
 * one chat. Off unless TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set
 * (deploy/.env). Sending never holds up or fails the request that caused it.
 */
const API = "https://api.telegram.org"

export function opsEnabled() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

/** Text for Telegram's HTML mode. */
export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Sends `html` to the admin's chat; logs and moves on if Telegram does not take it. */
export async function sendOps(html: string, { silent = false }: { silent?: boolean } = {}) {
  if (!opsEnabled()) return
  try {
    const response = await fetch(`${API}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: html.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: silent,
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) console.warn("Telegram send failed", response.status)
  } catch (error) {
    console.warn("Telegram send failed", (error as Error).name)
  }
}

/** Fire and forget, for code that must not wait on Telegram. */
export function notifyOps(html: string, options?: { silent?: boolean }) {
  void sendOps(html, options)
}
