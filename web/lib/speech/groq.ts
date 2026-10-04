import "server-only"

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions"
const MODEL = "whisper-large-v3-turbo"

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
 * What Whisper is told before the audio: a sentence or two in the style of
 * what is said here, and the names it should spell as written (the user's
 * own accounts first). Kept well under the 224 tokens Groq takes.
 */
export function transcriptionPrompt(accountNames: string[]) {
  const names = [...new Set([...accountNames.map((name) => name.trim()).filter(Boolean), ...KNOWN_NAMES])]
  let list = ""
  for (const name of names) {
    if (`${list}, ${name}`.length > 200) break
    list = list ? `${list}, ${name}` : name
  }
  return `Ăn sáng 35k tiền mặt. Chuyển 2 triệu từ MB Bank sang TPBank. Tài khoản: ${list}.`
}

type VerboseSegment = { text: string; no_speech_prob: number; avg_logprob: number }

/**
 * Lines Whisper is known to make up from silence or noise in Vietnamese,
 * learned from video subtitles.
 */
const HALLUCINATIONS = [/subscribe/i, /ghiền mì gõ/i, /cảm ơn các bạn đã (theo dõi|xem)/i, /hẹn gặp lại các bạn/i, /la la school/i]

/**
 * The words in a recording, through Whisper on Groq, in Vietnamese. Segments
 * that are most likely silence, and the lines Whisper makes up from it, are
 * left out.
 */
export async function transcribe(audio: File, prompt: string) {
  const body = new FormData()
  body.append("file", audio, audio.name || "speech.webm")
  body.append("model", MODEL)
  body.append("language", "vi")
  body.append("temperature", "0")
  body.append("response_format", "verbose_json")
  body.append("prompt", prompt)

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body,
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    throw new GroqError(response.status, await response.text().catch(() => ""))
  }
  const result = (await response.json()) as { text?: string; segments?: VerboseSegment[] }
  const segments = result.segments ?? [{ text: result.text ?? "", no_speech_prob: 0, avg_logprob: 0 }]
  return segments
    .filter((segment) => !(segment.no_speech_prob > 0.6 && segment.avg_logprob < -0.7))
    .map((segment) => segment.text.trim())
    .filter((text) => text && !HALLUCINATIONS.some((pattern) => pattern.test(text)))
    .join(" ")
    .trim()
}

export class GroqError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`Groq ${status}: ${detail.slice(0, 200)}`)
  }
}
