import "server-only"

import { GeminiError, geminiEnabled, geminiJson, geminiModels } from "@/lib/ai/gemini"
import { ollamaJson } from "@/lib/ai/ollama"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

/** A model over its quota is passed over this long, not asked again each time. */
const QUOTA_REST_MS = 60_000

/** When each Gemini model over its quota may be asked again. */
const restingUntil = new Map<string, number>()

/**
 * One JSON reply held to `schema`: from the Gemini models in turn when
 * GEMINI_API_KEY is set, each one failing (down, over its quota, a bad
 * reply) handing over to the next; else, or when all fail, from gemma on
 * the local Ollama.
 */
export async function aiJson(messages: ChatMessage[], schema: object): Promise<unknown> {
  if (geminiEnabled()) {
    for (const model of geminiModels) {
      if ((restingUntil.get(model) ?? 0) > Date.now()) continue
      try {
        return await geminiJson(model, messages, schema)
      } catch (error) {
        if (error instanceof GeminiError && error.status === 429) {
          restingUntil.set(model, Date.now() + QUOTA_REST_MS)
        }
        console.warn("Gemini failed, trying the next model", error instanceof Error ? error.message : error)
      }
    }
  }
  return ollamaJson(messages, schema)
}
