import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { DecodedIdToken } from "firebase-admin/auth"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"

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
  /** Resolves to false when the session was revoked or the user disabled. */
  notRevoked: Promise<boolean>
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
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return null
  }

  const auth = getFirebaseAdminAuth()

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, false)
    const notRevoked = auth
      .verifySessionCookie(sessionCookie, true)
      .then(() => true, () => false)

    return { user: toSessionUser(decodedToken), notRevoked }
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
 * receives data while the check no longer delays the reads.
 */
export async function loadWithSession<T>(
  load: (user: SessionUser) => Promise<T>,
): Promise<{ user: SessionUser; data: T }> {
  const session = await getVerifiedSession()

  if (!session) {
    redirect("/login")
  }

  const [notRevoked, data] = await Promise.all([
    session.notRevoked,
    load(session.user),
  ])

  if (!notRevoked) {
    redirect("/login")
  }

  return { user: session.user, data }
}
