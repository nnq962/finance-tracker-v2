import "server-only"

import type { SessionUser } from "@/lib/auth/session"

/** The session cookie's value for the dev user; Firebase never issues it. */
export const DEV_SESSION_VALUE = "dev-session"

export const DEV_USER: SessionUser = {
  uid: "dev-user",
  name: "Người dùng dev",
  email: "dev@localhost",
  emailVerified: true,
  avatar: "",
}

/**
 * Sign-in without Google, so pages can be opened and screenshotted on the dev
 * server. Only under `next dev`, with DEV_LOGIN=1 in .env.local, and only for
 * requests to localhost: a production build, or the dev server reached over
 * the network, never has it.
 */
export function isDevLoginEnabled(host: string | null) {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_LOGIN !== "1") return false
  const hostname = host?.replace(/:\d+$/, "")
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
}
