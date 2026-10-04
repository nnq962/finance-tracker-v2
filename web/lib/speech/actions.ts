"use server"

import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"
import { requireAdmin } from "@/lib/plans/admin"
import {
  GroqError,
  groqEnabled,
  pingGroq,
  transcribe,
  transcribeDetailed,
  transcriptionPrompt,
  type TranscriptionDetail,
} from "@/lib/speech/groq"

/** Recordings per user per hour; Groq's free tier allows 20 a minute and 2,000 a day for everyone. */
const TRANSCRIPTIONS_PER_HOUR = 60
/** Past the 30 seconds a recording may run, in any format a browser records; server actions take 1 MB. */
const MAX_AUDIO_BYTES = 1_000_000
const transcriptions = new Map<string, number[]>()

/** Which recogniser dictation uses: Whisper on the server, or the browser's own. */
export async function speechEngineAction(): Promise<"whisper" | "browser"> {
  await requireSession()
  return groqEnabled() ? "whisper" : "browser"
}

/** The words in a recording from the microphone, in Vietnamese. */
export async function transcribeAction(
  formData: FormData,
): Promise<{ success: true; text: string } | { success: false; error: string }> {
  const user = await requireSession()
  if (!groqEnabled()) return { success: false, error: "Chưa bật nhận dạng giọng nói." }

  const audio = formData.get("audio")
  if (!(audio instanceof File) || audio.size === 0) return { success: false, error: "Không nhận được âm thanh." }
  if (audio.size > MAX_AUDIO_BYTES) return { success: false, error: "Đoạn ghi âm quá dài." }

  const now = Date.now()
  const recent = (transcriptions.get(user.uid) ?? []).filter((time) => now - time < 3_600_000)
  if (recent.length >= TRANSCRIPTIONS_PER_HOUR) {
    return { success: false, error: "Bạn đã nói quá nhiều lần. Vui lòng thử lại sau hoặc gõ chữ." }
  }
  transcriptions.set(user.uid, [...recent, now])

  try {
    const accounts = await getAccounts(user.uid)
    const text = await transcribe(audio, transcriptionPrompt(accounts.map((account) => account.name)))
    return text ? { success: true, text } : { success: false, error: "Không nghe thấy tiếng nói." }
  } catch (error) {
    console.error("Transcription failed", error instanceof GroqError ? error.message : (error as Error).name)
    if (error instanceof GroqError && error.status === 429) {
      return { success: false, error: "Nhận dạng giọng nói đang quá tải. Vui lòng thử lại sau ít phút." }
    }
    return { success: false, error: "Không nhận dạng được giọng nói. Vui lòng thử lại." }
  }
}

/**
 * A recording through Whisper with the time each step took on the server,
 * and the bare network time to Groq measured after it. Admins only, for the
 * voice lab.
 */
export async function transcribeLabAction(formData: FormData): Promise<
  | {
      success: true
      detail: TranscriptionDetail
      prompt: string
      accountsMs: number
      serverMs: number
      pingMs?: number
    }
  | { success: false; error: string }
> {
  const admin = await requireAdmin()
  if (!groqEnabled()) return { success: false, error: "Chưa có GROQ_API_KEY trên máy chủ." }
  const audio = formData.get("audio")
  if (!(audio instanceof File) || audio.size === 0) return { success: false, error: "Không nhận được âm thanh." }

  const startedAt = performance.now()
  try {
    const accounts = await getAccounts(admin.uid)
    const accountsMs = Math.round(performance.now() - startedAt)
    const prompt = transcriptionPrompt(accounts.map((account) => account.name))
    const detail = await transcribeDetailed(audio, prompt)
    const serverMs = Math.round(performance.now() - startedAt)
    const pingMs = await pingGroq().catch(() => undefined)
    return { success: true, detail, prompt, accountsMs, serverMs, ...(pingMs !== undefined ? { pingMs } : {}) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Không nhận dạng được." }
  }
}
