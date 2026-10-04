import "server-only"

import { notFound } from "next/navigation"

import { requireSession, type SessionUser } from "@/lib/auth/session"

/**
 * Admins are the verified addresses in ADMIN_EMAILS (comma separated), set
 * on the server: they grant Pro by hand and see every user.
 */
export function isAdmin(user: SessionUser) {
  return user.emailVerified && adminEmails().includes(user.email.toLowerCase())
}

/** The addresses in ADMIN_EMAILS, lower case. */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/** The signed-in admin; anyone else gets a 404, as if nothing were here. */
export async function requireAdmin() {
  const user = await requireSession()
  if (!isAdmin(user)) notFound()
  return user
}
