import "server-only"

import { geminiEnabled, geminiJson } from "@/lib/ai/gemini"
import { ollamaJson } from "@/lib/ai/ollama"

export type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

/**
 * One JSON reply held to `schema`: from Gemini when GEMINI_API_KEY is set,
 * else, or when Gemini fails (down, over its limits, a bad reply), from
 * gemma on the local Ollama.
 */
export async function aiJson(messages: ChatMessage[], schema: object): Promise<unknown> {
  if (geminiEnabled()) {
    try {
      return await geminiJson(messages, schema)
    } catch (error) {
      console.warn("Gemini failed, falling back to Ollama", error instanceof Error ? error.message : error)
    }
  }
  return ollamaJson(messages, schema)
}
