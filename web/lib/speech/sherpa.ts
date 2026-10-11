import "server-only"

/**
 * Speech to text on this server: the stt service (backend/stt), sherpa-onnx
 * with a Vietnamese Zipformer model on the CPU, about 50 ms a sentence. It
 * favours the names given as hotwords only where the sound fits them, so it
 * never writes a name nobody said, as Whisper copied its prompt. It answers
 * in capitals, without punctuation, with amounts in words ("bốn nhăm ca").
 */
export function sherpaEnabled() {
  return Boolean(process.env.STT_URL)
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** Its capitals as a sentence, the names back as their brands write them. */
function asSentence(text: string, names: string[]) {
  let sentence = text.toLocaleLowerCase("vi-VN")
  for (const name of names) {
    const pattern = name.split(/\s+/).map(escape).join("\\s*")
    sentence = sentence.replace(new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, "giu"), name)
  }
  return sentence.charAt(0).toLocaleUpperCase("vi-VN") + sentence.slice(1)
}

/** The words in a recording, with how long the model took on the server. */
export async function transcribeOnServer(audio: File, spokenNames: string[]) {
  // "ví MoMo" is said with "ví" before the name; the hotword is the name.
  const names = [...new Set(spokenNames.map((name) => name.replace(/^ví\s+/i, "").trim()).filter(Boolean))]
  const response = await fetch(`${process.env.STT_URL}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "X-Hotwords": names.map(encodeURIComponent).join("/") },
    body: Buffer.from(await audio.arrayBuffer()),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`stt ${response.status}: ${(await response.text().catch(() => "")).slice(0, 200)}`)
  const result = (await response.json()) as { text?: string; ms?: number }
  const raw = (result.text ?? "").trim()
  return { text: asSentence(raw, names), raw, ms: result.ms ?? 0 }
}
