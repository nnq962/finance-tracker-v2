import "server-only"

import { normalizeTranscript } from "@/lib/speech/normalize"

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"
/**
 * large-v3, not turbo: in the voice lab's name test on an iPhone it heard 62%
 * of bank and wallet names right against turbo's 42%, and 28 of the 36
 * readings of the twelve most used against 22. Groq's free tier limits both alike.
 */
const MODEL = "whisper-large-v3"

/** Whisper models on Groq, the one dictation uses first: large-v3 the more accurate, turbo the faster and cheaper. */
export const WHISPER_MODELS = ["whisper-large-v3", "whisper-large-v3-turbo"] as const
export type WhisperModel = (typeof WHISPER_MODELS)[number]

/** Whisper on Groq is used once GROQ_API_KEY is set on the server; until then the browser's own recogniser is. */
export function groqEnabled() {
  return Boolean(process.env.GROQ_API_KEY)
}

/** A name the user's money is kept under, said as people say it: a wallet as "ví MoMo". */
export type SpokenAccount = { name: string; wallet?: boolean }

/** Said just before the audio: amounts in the forms people use, without a bank's name. */
const AMOUNTS = "Ăn sáng 35k tiền mặt. Đổ xăng hết 80 nghìn. Nhận lương 15 củ. Mua điện thoại 7 triệu rưỡi."

/** Each of the user's accounts in a sentence of its own, these in turn. */
const ACCOUNT_SENTENCES = [
  (name: string) => `Trả bằng ${name}.`,
  (name: string) => `Chuyển 500k vào ${name}.`,
  (name: string) => `Nạp 200 nghìn vào ${name}.`,
  (name: string) => `Rút 2 triệu từ ${name}.`,
]

/** Well under the 224 tokens Groq takes; Vietnamese runs to about one token per two or three characters. */
const PROMPT_MAX_LENGTH = 400

/**
 * What Whisper is told before the audio. It reads as the text spoken just
 * before, so it is written the way people say money here: amounts in "k",
 * "củ" and "triệu", then the user's own accounts each in a sentence, so their
 * names come out spelled as written. No list of names and no label: Whisper
 * gave back "Tài khoản." for audio it could not make out, and a listed bank
 * the user had not said ("BIDV, Viettel Money"), when the prompt ended in
 * "Tài khoản: …" over every common bank.
 */
export function transcriptionPrompt(accounts: SpokenAccount[]) {
  // "Tiền mặt" is in the amounts already; "Ví ZaloPay" and the wallet ZaloPay are said alike.
  const seen = new Set<string>(["tiền mặt"])
  let prompt = AMOUNTS
  for (const account of accounts) {
    const name = account.name.trim()
    const spoken = account.wallet ? `ví ${name}` : name
    const key = spoken.toLocaleLowerCase("vi-VN")
    if (!name || seen.has(key)) continue
    seen.add(key)
    const sentence = ACCOUNT_SENTENCES[(seen.size - 2) % ACCOUNT_SENTENCES.length](spoken)
    if (prompt.length + sentence.length + 1 > PROMPT_MAX_LENGTH) break
    prompt = `${prompt} ${sentence}`
  }
  return prompt
}

export type VerboseSegment = { text: string; no_speech_prob: number; avg_logprob: number }

/**
 * Lines Whisper is known to make up from silence or noise in Vietnamese,
 * learned from video subtitles.
 */
const HALLUCINATIONS = [/subscribe/i, /ghiền mì gõ/i, /cảm ơn các bạn đã (theo dõi|xem)/i, /hẹn gặp lại các bạn/i, /la la school/i]

/**
 * Whole answers Whisper gives for a short sound it cannot make out: heard in
 * the voice lab in place of a wallet's name, never said.
 */
const FILLERS = new Set(["tạm biệt", "tài khoản", "bây giờ", "cảm ơn", "cảm ơn các bạn", "tài khoản tạm biệt"])
const isFiller = (text: string) => FILLERS.has(text.toLocaleLowerCase("vi-VN").replace(/[.,!?…\s]+/g, " ").trim())

/** A transcription with what it took: Groq's segments and the time the call ran. */
export type TranscriptionDetail = {
  text: string
  /** Everything Whisper returned, before silence and made-up lines were left out and names put right. */
  rawText: string
  segments: VerboseSegment[]
  /** From sending the audio to Groq until its answer was read. */
  groqMs: number
  /** Groq's own processing time, from its usage report, when given. */
  groqProcessingMs?: number
  region?: string
}

/**
 * The words in a recording, through Whisper on Groq, in Vietnamese. Segments
 * that are most likely silence, and the lines Whisper makes up from it, are
 * left out, and the bank and wallet names it steadily mishears put right.
 */
export async function transcribe(audio: File, prompt: string) {
  return (await transcribeDetailed(audio, prompt)).text
}

export async function transcribeDetailed(
  audio: File,
  prompt: string,
  model: WhisperModel = MODEL,
): Promise<TranscriptionDetail> {
  const body = new FormData()
  body.append("file", audio, audio.name || "speech.webm")
  body.append("model", model)
  body.append("language", "vi")
  body.append("temperature", "0")
  body.append("response_format", "verbose_json")
  // None in the voice lab, to hear Whisper on its own.
  if (prompt) body.append("prompt", prompt)

  const startedAt = performance.now()
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body,
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    throw new GroqError(response.status, await response.text().catch(() => ""))
  }
  const result = (await response.json()) as {
    text?: string
    segments?: VerboseSegment[]
    x_groq?: { usage?: { total_time?: number } }
  }
  const groqMs = Math.round(performance.now() - startedAt)
  const segments = result.segments ?? [{ text: result.text ?? "", no_speech_prob: 0, avg_logprob: 0 }]
  const heard = segments
    .filter((segment) => !(segment.no_speech_prob > 0.6 && segment.avg_logprob < -0.7))
    .map((segment) => segment.text.trim())
    .filter((part) => part && !HALLUCINATIONS.some((pattern) => pattern.test(part)))
    .join(" ")
    .trim()
  const text = isFiller(heard) ? "" : normalizeTranscript(heard)
  const totalTime = result.x_groq?.usage?.total_time
  return {
    text,
    rawText: (result.text ?? "").trim(),
    segments: segments.map(({ text: part, no_speech_prob, avg_logprob }) => ({ text: part, no_speech_prob, avg_logprob })),
    groqMs,
    ...(typeof totalTime === "number" ? { groqProcessingMs: Math.round(totalTime * 1000) } : {}),
    ...(response.headers.get("x-groq-region") ? { region: response.headers.get("x-groq-region")! } : {}),
  }
}

/** How long a request to Groq that carries nothing takes: the network to it and back. */
export async function pingGroq() {
  const startedAt = performance.now()
  await fetch(`https://api.groq.com/openai/v1/models/${MODEL}`, {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    signal: AbortSignal.timeout(10_000),
  })
  return Math.round(performance.now() - startedAt)
}

export class GroqError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`Groq ${status}: ${detail.slice(0, 200)}`)
  }
}
