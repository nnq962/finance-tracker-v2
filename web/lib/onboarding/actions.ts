"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"

import { hideChecklist, markOnboardingSeen } from "./repository"

export async function markOnboardingSeenAction() {
  const user = await requireSession()
  await markOnboardingSeen(user.uid)
}

export async function hideChecklistAction() {
  const user = await requireSession()
  await hideChecklist(user.uid)
  revalidatePath("/overview")
}
