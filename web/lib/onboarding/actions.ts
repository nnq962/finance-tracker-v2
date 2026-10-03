"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth/session"

import { isMissionKey } from "./missions"
import { claimMissionReward, markOnboardingSeen } from "./repository"

export async function markOnboardingSeenAction() {
  const user = await requireSession()
  await markOnboardingSeen(user.uid)
}

/**
 * Claims a finished mission's AI credits. `doneInBrowser` only counts for the
 * missions the server cannot see, such as installing the app.
 */
export async function claimMissionRewardAction(
  mission: unknown,
  doneInBrowser: unknown = false,
): Promise<{ success: true; aiCredits: number } | { success: false; error: string }> {
  const user = await requireSession()
  if (!isMissionKey(mission)) return { success: false, error: "Nhiệm vụ không hợp lệ." }

  try {
    const aiCredits = await claimMissionReward(user.uid, mission, doneInBrowser === true)
    if (aiCredits === null) return { success: false, error: "Nhiệm vụ chưa hoàn thành hoặc đã nhận thưởng." }
    revalidatePath("/overview")
    return { success: true, aiCredits }
  } catch (error) {
    console.error("Mission reward claim failed", { mission }, error)
    return { success: false, error: "Không nhận được thưởng. Vui lòng thử lại." }
  }
}
