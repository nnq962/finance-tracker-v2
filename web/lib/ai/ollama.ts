import "server-only"

// Ollama runs beside the web service on the compose network, never published.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://ollama:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gemma4:e4b"

export type OllamaMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

/** The model could not be reached, timed out, or did not answer in JSON. */
export class OllamaError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "OllamaError"
  }
}

/**
 * One reply from the local model, held to the JSON schema `format` and
 * parsed. Deterministic (temperature 0), with no thinking step.
 */
export async function ollamaJson(
  messages: OllamaMessage[],
  format: object,
  { timeoutMs = 15_000 }: { timeoutMs?: number } = {},
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        format,
        stream: false,
        think: false,
        options: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    })
  } catch (error) {
    throw new OllamaError("Ollama did not answer", { cause: error })
  }

  if (!response.ok) {
    throw new OllamaError(`Ollama answered ${response.status}: ${await response.text()}`)
  }

  const body = (await response.json()) as { message?: { content?: string } }
  try {
    return JSON.parse(body.message?.content ?? "")
  } catch (error) {
    throw new OllamaError("Ollama's reply is not JSON", { cause: error })
  }
}
