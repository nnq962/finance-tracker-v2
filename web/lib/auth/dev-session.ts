import "server-only"

import { timingSafeEqual } from "node:crypto"

import type { SessionUser } from "@/lib/auth/session"

/** The session cookie's value for the dev user; Firebase never issues it. */
export const DEV_SESSION_VALUE = "dev-session"

/** Holds DEV_TUNNEL_KEY in a browser that signed in through the dev tunnel. */
export const DEV_TUNNEL_KEY_COOKIE = "dev-tunnel-key"

export const DEV_USER: SessionUser = {
  uid: "dev-user",
  name: "Người dùng dev",
  email: "dev@localhost",
  emailVerified: true,
  avatar: "",
}

function isTunnelKey(value: string | null | undefined) {
  const key = process.env.DEV_TUNNEL_KEY
  // A short key would be guessable; the tunnel is reachable from anywhere.
  if (!key || key.length < 32 || !value) return false
  const expected = Buffer.from(key)
  const given = Buffer.from(value)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * Sign-in without Google, so pages can be opened and screenshotted on the dev
 * server. Only under `next dev` with DEV_LOGIN=1 in .env.local, and only for
 * requests to localhost, or to the dev tunnel's host (DEV_TUNNEL_HOST) with
 * the secret DEV_TUNNEL_KEY. A production build, or the dev server reached
 * any other way, never has it.
 */
export function isDevLoginEnabled(host: string | null, tunnelKey?: string | null) {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_LOGIN !== "1") return false
  const hostname = host?.replace(/:\d+$/, "")
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true
  return Boolean(process.env.DEV_TUNNEL_HOST) && hostname === process.env.DEV_TUNNEL_HOST && isTunnelKey(tunnelKey)
}
