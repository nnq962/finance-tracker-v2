import "server-only"

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"
const MODEL = "whisper-large-v3-turbo"

/** Whisper models on Groq: turbo is the faster and cheaper, large-v3 the more accurate. */
export const WHISPER_MODELS = ["whisper-large-v3-turbo", "whisper-large-v3"] as const
export type WhisperModel = (typeof WHISPER_MODELS)[number]

/** Whisper on Groq is used once GROQ_API_KEY is set on the server; until then the browser's own recogniser is. */
export function groqEnabled() {
  return Boolean(process.env.GROQ_API_KEY)
}

/** Banks and wallets people name when they talk money, spelled as their brands are. */
const KNOWN_NAMES = [
  "MB Bank",
  "TPBank",
  "VPBank",
  "Vietcombank",
  "Techcombank",
  "BIDV",
  "VietinBank",
  "ACB",
  "Agribank",
  "Sacombank",
  "MoMo",
  "ZaloPay",
]

/**
 * What Whisper is told before the audio. It reads as the text spoken just
 * before, so it is written the way people say money here, with amounts in
 * "k" and "củ" and banks spelled as their brands are; the user's own
 * accounts lead the list of names. Kept well under the 224 tokens Groq takes.
 */
export function transcriptionPrompt(accountNames: string[]) {
  const sample =
    "Ăn sáng 35k tiền mặt. Đi siêu thị hết 500k, trả bằng Sacombank. Nhận lương 15 củ vào Vietcombank. Chuyển 2 triệu từ MB Bank sang TPBank. Nạp 200k vào MoMo."
  const names = [...new Set([...accountNames.map((name) => name.trim()).filter(Boolean), ...KNOWN_NAMES])]
  let list = ""
  for (const name of names) {
    if (`${list}, ${name}`.length > 160) break
    list = list ? `${list}, ${name}` : name
  }
  return `${sample} Tài khoản: ${list}.`
}

export type VerboseSegment = { text: string; no_speech_prob: number; avg_logprob: number }

/**
 * Lines Whisper is known to make up from silence or noise in Vietnamese,
 * learned from video subtitles.
 */
const HALLUCINATIONS = [/subscribe/i, /ghiền mì gõ/i, /cảm ơn các bạn đã (theo dõi|xem)/i, /hẹn gặp lại các bạn/i, /la la school/i]

/** A transcription with what it took: Groq's segments and the time the call ran. */
export type TranscriptionDetail = {
  text: string
  /** Everything Whisper returned, before silence and made-up lines were left out. */
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
 * left out.
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
  body.append("prompt", prompt)

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
  const text = segments
    .filter((segment) => !(segment.no_speech_prob > 0.6 && segment.avg_logprob < -0.7))
    .map((segment) => segment.text.trim())
    .filter((part) => part && !HALLUCINATIONS.some((pattern) => pattern.test(part)))
    .join(" ")
    .trim()
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
