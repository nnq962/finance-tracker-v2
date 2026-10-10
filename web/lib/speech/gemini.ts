import "server-only"

/**
 * Gemini Flash-Lite as a speech recogniser, tried in the voice lab against
 * Whisper and the browser's: it hears the audio and writes what was said,
 * told the names to spell in its instructions rather than in text it would
 * read as said just before, as Whisper's prompt is.
 */
export const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"] as const
export type GeminiModel = (typeof GEMINI_MODELS)[number]

export function geminiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY)
}

/**
 * No sentence to copy: with example sentences ("35k", "Vietcombank sang ví
 * MoMo") in the instructions, both models made up a whole payment from
 * silence, noise or a tone, every time. With these and has_speech, nothing.
 */
function instructions(names: string[]) {
  return [
    "Transcribe the speech in the audio verbatim, in Vietnamese.",
    "If the audio has no human speech (silence, noise, tones, music), set has_speech to false and text to an empty string.",
    "Never invent words that are not spoken.",
    `When one of these names is spoken, spell it exactly so: ${names.join(", ")}.`,
    "Write amounts with digits as said (35k, 15 củ, 2 triệu rưỡi).",
  ].join(" ")
}

export class GeminiError extends Error {
  constructor(
    readonly status: number,
    detail: string,
  ) {
    super(`Gemini ${status}: ${detail.slice(0, 200)}`)
  }
}

/** The words in a recording, as Gemini heard them, and how long the call took. */
export async function transcribeWithGemini(audio: File, names: string[], model: GeminiModel) {
  const data = Buffer.from(await audio.arrayBuffer()).toString("base64")
  const body = {
    system_instruction: { parts: [{ text: instructions(names) }] },
    contents: [
      {
        role: "user",
        parts: [{ inline_data: { mime_type: audio.type.split(";")[0] || "audio/webm", data } }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { has_speech: { type: "BOOLEAN" }, text: { type: "STRING" } },
        required: ["has_speech", "text"],
      },
    },
  }
  const startedAt = performance.now()
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new GeminiError(response.status, await response.text().catch(() => ""))
  const result = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const answer = (result.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("")
  let heard: { has_speech?: boolean; text?: string } = {}
  try {
    heard = JSON.parse(answer) as typeof heard
  } catch {}
  const text = heard.has_speech === false ? "" : (heard.text ?? "").trim()
  return { text, ms: Math.round(performance.now() - startedAt) }
}
