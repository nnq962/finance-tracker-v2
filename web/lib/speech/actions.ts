"use server"

import { getAccounts } from "@/lib/accounts/repository"
import type { Account } from "@/lib/accounts/types"
import { requireSession } from "@/lib/auth/session"
import { getInstitution } from "@/lib/institutions"
import { requireAdmin } from "@/lib/plans/admin"
import { normalizeTranscript } from "@/lib/speech/normalize"
import { sherpaEnabled, transcribeOnServer } from "@/lib/speech/sherpa"
import {
  GroqError,
  groqEnabled,
  pingGroq,
  transcribe,
  transcribeDetailed,
  namesPrompt,
  spokenNames,
  transcriptionPrompt,
  WHISPER_MODELS,
  type SpokenAccount,
  type TranscriptionDetail,
  type WhisperModel,
} from "@/lib/speech/groq"

/** Recordings per user per hour; Groq's free tier, the fallback, allows 20 a minute and 2,000 a day for everyone. */
const TRANSCRIPTIONS_PER_HOUR = 60
/** Past the 30 seconds a recording may run, in any format a browser records; server actions take 1 MB. */
const MAX_AUDIO_BYTES = 1_000_000
const transcriptions = new Map<string, number[]>()

/** The names a user's accounts go by: each account's own, and its bank's or wallet's brand. */
function accountNames(accounts: Account[]): SpokenAccount[] {
  return accounts
    .filter((account) => account.status === "active")
    .flatMap((account) => {
      const wallet = account.type === "e-wallet"
      const brand =
        account.institutionId && (account.type === "bank" || account.type === "e-wallet")
          ? getInstitution(account.type, account.institutionId)?.shortName
          : undefined
      return [
        // The brand first: what people say ("trả bằng MoMo"), more than the account's own name.
        ...(brand ? [{ name: brand, wallet }] : []),
        { name: account.name, wallet: wallet && !account.name.toLowerCase().startsWith("ví") },
      ]
    })
}

/** How long dictation waits for this server's recogniser, which answers in well under a second, before Whisper. */
const SHERPA_TIMEOUT_MS = 5_000

/**
 * The words in a recording from the microphone, in Vietnamese: through this
 * server's recogniser (sherpa-onnx), favouring the user's accounts and every
 * bank and wallet; when it cannot be had, through Whisper on Groq. Chosen in
 * the voice lab, on an iPhone: 24 of 24 sentences right, names and sums,
 * against Whisper's 19 to 20 and the browser's 13, in about 50 ms.
 */
export async function transcribeAction(
  formData: FormData,
): Promise<
  | { success: true; text: string }
  /** `fallback`: no recogniser on the server can be had, so the browser's should take over. */
  | { success: false; error: string; fallback?: boolean }
> {
  const user = await requireSession()
  if (!sherpaEnabled() && !groqEnabled()) return { success: false, error: "Chưa bật nhận dạng giọng nói." }

  const audio = formData.get("audio")
  if (!(audio instanceof File) || audio.size === 0) return { success: false, error: "Không nhận được âm thanh." }
  if (audio.size > MAX_AUDIO_BYTES) return { success: false, error: "Đoạn ghi âm quá dài." }

  const now = Date.now()
  const recent = (transcriptions.get(user.uid) ?? []).filter((time) => now - time < 3_600_000)
  if (recent.length >= TRANSCRIPTIONS_PER_HOUR) {
    return { success: false, error: "Bạn đã nói quá nhiều lần. Vui lòng thử lại sau hoặc gõ chữ." }
  }
  transcriptions.set(user.uid, [...recent, now])

  const spoken = accountNames(await getAccounts(user.uid).catch(() => []))
  const heard = (text: string) => (text ? { success: true as const, text } : { success: false as const, error: "Không nghe thấy tiếng nói." })

  if (sherpaEnabled()) {
    try {
      const { text } = await transcribeOnServer(audio, spokenNames(spoken), SHERPA_TIMEOUT_MS)
      // Silence is an answer, not a failure: Whisper would make words up from it.
      return heard(normalizeTranscript(text))
    } catch (error) {
      console.error("Transcription on this server failed", (error as Error).message)
    }
  }
  if (!groqEnabled()) return { success: false, error: "Nhận dạng giọng nói đang gặp sự cố.", fallback: true }

  try {
    // The bare names after the amounts: in the voice lab Whisper gave the
    // sentences of the other prompt back whole, sums and all.
    return heard(await transcribe(audio, namesPrompt(spoken)))
  } catch (error) {
    console.error("Transcription failed", error instanceof GroqError ? error.message : (error as Error).name)
    // Over the limit, Groq down or too slow: the browser's recogniser hears the next try.
    if (!(error instanceof GroqError) || error.status === 429 || error.status >= 500) {
      return { success: false, error: "Nhận dạng giọng nói đang quá tải. Vui lòng thử lại sau ít phút.", fallback: true }
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
  const requested = formData.get("model")
  const model = WHISPER_MODELS.find((name) => name === requested) ?? WHISPER_MODELS[0]
  // The prompt to try: dictation's ("full", the default), the amounts and names bare, or none.
  const promptKind = formData.get("prompt")

  const startedAt = performance.now()
  try {
    const accounts = await getAccounts(admin.uid)
    const accountsMs = Math.round(performance.now() - startedAt)
    const spoken = accountNames(accounts)
    const prompt = promptKind === "off" ? "" : promptKind === "names" ? namesPrompt(spoken) : transcriptionPrompt(spoken)
    const detail = await transcribeDetailed(audio, prompt, model as WhisperModel)
    const serverMs = Math.round(performance.now() - startedAt)
    const pingMs = await pingGroq().catch(() => undefined)
    return { success: true, detail, prompt, accountsMs, serverMs, ...(pingMs !== undefined ? { pingMs } : {}) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Không nhận dạng được." }
  }
}

/**
 * A recording through the speech recogniser on this server, favouring the
 * user's accounts and the common banks. Admins only, for the voice lab.
 */
export async function transcribeSherpaLabAction(
  formData: FormData,
): Promise<{ success: true; text: string; rawText: string; ms: number } | { success: false; error: string }> {
  const admin = await requireAdmin()
  if (!sherpaEnabled()) return { success: false, error: "Chưa có STT_URL trên máy chủ." }
  const audio = formData.get("audio")
  if (!(audio instanceof File) || audio.size === 0) return { success: false, error: "Không nhận được âm thanh." }
  try {
    const accounts = await getAccounts(admin.uid)
    const startedAt = performance.now()
    const { text, raw } = await transcribeOnServer(audio, spokenNames(accountNames(accounts)))
    // The whole call, decoding the audio included, as Whisper's is timed.
    return { success: true, text: normalizeTranscript(text), rawText: raw, ms: Math.round(performance.now() - startedAt) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Không nhận dạng được." }
  }
}
