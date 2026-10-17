"use server"

import { requireSession } from "@/lib/auth/session"

import { markNoticesRead } from "./notices"

/** Marks the given notices read for the signed-in user. */
export async function markNoticesReadAction(keys: string[]): Promise<void> {
  const user = await requireSession()
  if (!Array.isArray(keys)) return
  await markNoticesRead(user.uid, keys.slice(0, 100))
}
