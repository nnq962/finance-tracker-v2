import "server-only"

import type { ChatMessage } from "@/lib/ai/llm"

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite"

/** Gemini is used once GEMINI_API_KEY is set on the server. */
export function geminiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY)
}

/** Gemini could not be reached, refused, timed out, or did not answer in JSON. */
export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "GeminiError"
  }
}

/**
 * One reply from Gemini, held to the JSON schema `schema` and parsed.
 * Deterministic (temperature 0), thinking as little as the model allows.
 * The system message becomes its instruction; the rest are the turns.
 */
export async function geminiJson(
  messages: ChatMessage[],
  schema: object,
  { timeoutMs = 15_000 }: { timeoutMs?: number } = {},
): Promise<unknown> {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n")
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }))

  let response: Response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents,
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            // Flash-Lite goes down to "minimal"; Flash to "low".
            thinkingConfig: { thinkingLevel: GEMINI_MODEL.includes("lite") ? "minimal" : "low" },
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      },
    )
  } catch (error) {
    throw new GeminiError("Gemini did not answer", undefined, { cause: error })
  }

  if (!response.ok) {
    throw new GeminiError(`Gemini answered ${response.status}: ${(await response.text()).slice(0, 300)}`, response.status)
  }

  const body = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]
  }
  const text = (body.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new GeminiError("Gemini's reply is not JSON", undefined, { cause: error })
  }
}
