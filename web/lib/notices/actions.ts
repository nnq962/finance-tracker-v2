"use server"

import { requireSession } from "@/lib/auth/session"

import { getNotices, markNoticesRead } from "./notices"
import type { Notice } from "./types"

/** The signed-in user's notices, newest first, as they stand now. */
export async function getNoticesAction(): Promise<Notice[]> {
  const user = await requireSession()
  try {
    return await getNotices(user.uid)
  } catch (error) {
    console.error("Notices failed", error)
    return []
  }
}

/** Marks the given notices read for the signed-in user. */
export async function markNoticesReadAction(keys: string[]): Promise<void> {
  const user = await requireSession()
  if (!Array.isArray(keys)) return
  await markNoticesRead(user.uid, keys.slice(0, 100))
}
