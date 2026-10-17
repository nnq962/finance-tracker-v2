import { createHash } from "node:crypto"
import { cache } from "react"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Auth, DecodedIdToken } from "firebase-admin/auth"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { DEV_SESSION_VALUE, DEV_TUNNEL_KEY_COOKIE, DEV_USER, isDevLoginEnabled } from "@/lib/auth/dev-session"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"
import { logIfSlow } from "@/lib/slow-log"

export type SessionUser = {
  uid: string
  name: string
  email: string
  /** Firebase confirmed the address belongs to this user (always so with Google). */
  emailVerified: boolean
  avatar: string
}

type VerifiedSession = {
  user: SessionUser
  /** When the session cookie runs out, in ms since the epoch. */
  expiresAt: number
  /** Resolves to false when the session was revoked or the user disabled. */
  notRevoked: Promise<boolean>
}

/*
 * The revocation check is a round trip to Google (about 0.3 s from the home
 * server), and every page, server action and session check waited for it. A
 * session found not revoked is taken as such for the next minute (2026-10-17):
 * a session revoked meanwhile (every device signed out, the account disabled)
 * keeps working for at most that long. Keyed by a hash of the cookie, never
 * the cookie itself; one process serves the app, so memory is enough, and a
 * deploy simply starts empty. Checks already under way are shared.
 */
const NOT_REVOKED_FOR_MS = 60_000
const notRevokedUntil = new Map<string, number>()
const checking = new Map<string, Promise<boolean>>()

function sessionKey(sessionCookie: string) {
  return createHash("sha256").update(sessionCookie).digest("base64url")
}

function checkNotRevoked(auth: Auth, sessionCookie: string): Promise<boolean> {
  const key = sessionKey(sessionCookie)
  const until = notRevokedUntil.get(key)
  if (until !== undefined && until > Date.now()) return Promise.resolve(true)

  const pending = checking.get(key)
  if (pending) return pending

  const startedAt = performance.now()
  const check = auth.verifySessionCookie(sessionCookie, true).then(
    () => {
      logIfSlow("revocation check", performance.now() - startedAt)
      // Old entries go once the map grows; a minute's worth of users is small.
      if (notRevokedUntil.size > 5000) {
        const now = Date.now()
        for (const [entry, time] of notRevokedUntil) if (time <= now) notRevokedUntil.delete(entry)
      }
      notRevokedUntil.set(key, Date.now() + NOT_REVOKED_FOR_MS)
      return true
    },
    () => {
      notRevokedUntil.delete(key)
      return false
    },
  ).finally(() => checking.delete(key))
  checking.set(key, check)
  return check
}

/** Signing out: this cookie is checked with Google again if it ever comes back. */
export function forgetSessionCheck(sessionCookie: string) {
  notRevokedUntil.delete(sessionKey(sessionCookie))
}

function toSessionUser(decodedToken: DecodedIdToken): SessionUser {
  return {
    uid: decodedToken.uid,
    name:
      decodedToken.name ??
      decodedToken.email?.split("@")[0] ??
      "Người dùng",
    email: decodedToken.email ?? "",
    emailVerified: decodedToken.email_verified === true,
    avatar: decodedToken.picture ?? "",
  }
}

/**
 * Verifies the cookie signature locally (no network once the public keys are
 * cached) and starts the revocation lookup without waiting for it, so callers
 * can overlap that round trip with their own reads.
 */
const getVerifiedSession = cache(async (): Promise<VerifiedSession | null> => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return null
  }

  if (sessionCookie === DEV_SESSION_VALUE) {
    return isDevLoginEnabled((await headers()).get("host"), cookieStore.get(DEV_TUNNEL_KEY_COOKIE)?.value)
      ? { user: DEV_USER, expiresAt: Number.MAX_SAFE_INTEGER, notRevoked: Promise.resolve(true) }
      : null
  }

  const auth = getFirebaseAdminAuth()

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, false)
    const notRevoked = checkNotRevoked(auth, sessionCookie)

    return { user: toSessionUser(decodedToken), expiresAt: decodedToken.exp * 1000, notRevoked }
  } catch {
    return null
  }
})

/** Fully verified user, including the revocation check, or null. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getVerifiedSession()

  if (!session || !(await session.notRevoked)) {
    return null
  }

  return session.user
})

/** Whether this is the dev user from /api/dev/login, who has no Firebase account. */
export function isDevSessionUser(user: SessionUser) {
  return user.uid === DEV_USER.uid && user.email === DEV_USER.email
}

/**
 * For the app's shell (the main layout): the user from the cookie's signature
 * alone, checked here without the network, so the shell and each page's
 * loading screen go out without waiting for the revocation check. Never use
 * it to read data: pages do that through loadWithSession, which still waits
 * for the check before handing anything over.
 */
export async function requireSignedSession() {
  const session = await getVerifiedSession()

  if (!session) {
    redirect("/login")
  }

  return { user: session.user, expiresAt: session.expiresAt }
}

/** Fully verified user; redirects to login otherwise. Use for mutations. */
export async function requireSession() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

/**
 * For page reads: runs `load` in parallel with the revocation check and only
 * returns its result once the session is confirmed, so a revoked session never
 * receives data while the check no longer delays the reads. A page whose
 * reads were slow is logged by its name (`page`), with how long the reads and
 * the session each took (lib/slow-log).
 */
export async function loadWithSession<T>(
  page: string,
  load: (user: SessionUser) => Promise<T>,
): Promise<{ user: SessionUser; data: T }> {
  const startedAt = performance.now()
  const session = await getVerifiedSession()

  if (!session) {
    redirect("/login")
  }

  const since = () => Math.round(performance.now() - startedAt)
  let sessionMs = 0
  let dataMs = 0
  const [notRevoked, data] = await Promise.all([
    session.notRevoked.then((value) => {
      sessionMs = since()
      return value
    }),
    load(session.user).then((value) => {
      dataMs = since()
      return value
    }),
  ])
  logIfSlow(`page ${page}`, performance.now() - startedAt, `data ${dataMs}ms, session ${sessionMs}ms`)

  if (!notRevoked) {
    redirect("/login")
  }

  return { user: session.user, data }
}
