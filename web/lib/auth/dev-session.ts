import "server-only"

import { createRemoteJWKSet, jwtVerify } from "jose"

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

const accessTeamDomain = process.env.DEV_ACCESS_TEAM_DOMAIN
const accessAudience = process.env.DEV_ACCESS_AUD
// Cloudflare Access's signing keys, fetched once and cached by jose.
const accessKeys = accessTeamDomain
  ? createRemoteJWKSet(new URL(`https://${accessTeamDomain}/cdn-cgi/access/certs`))
  : null

/** The request passed Cloudflare Access: its signed assertion is valid for this application. */
async function passedCloudflareAccess(requestHeaders: Headers) {
  const assertion = requestHeaders.get("cf-access-jwt-assertion")
  if (!accessKeys || !accessAudience || !assertion) return false
  try {
    await jwtVerify(assertion, accessKeys, {
      issuer: `https://${accessTeamDomain}`,
      audience: accessAudience,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Sign-in without Google, so pages can be opened and screenshotted on the dev
 * server. Only under `next dev` with DEV_LOGIN=1 in .env.local, and only for
 * requests to localhost, or to the dev tunnel's host (DEV_TUNNEL_HOST) when
 * Cloudflare Access let the request through. A production build, or the dev
 * server reached any other way, never has it.
 */
export async function isDevLoginEnabled(requestHeaders: Headers) {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_LOGIN !== "1") return false
  const hostname = requestHeaders.get("host")?.replace(/:\d+$/, "")
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true
  return (
    Boolean(process.env.DEV_TUNNEL_HOST) &&
    hostname === process.env.DEV_TUNNEL_HOST &&
    (await passedCloudflareAccess(requestHeaders))
  )
}
