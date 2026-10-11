import "server-only"

import { banks, eWallets } from "@/lib/institutions"
import { normalizeTranscript } from "@/lib/speech/normalize"

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

// Every bank people here use (the foreign ones, HSBC on, left out) and every wallet:
// no token limit here, as Whisper's prompt has, and names left out came back
// as sounds ("E sim bank", "Sebang", "Cách").
const firstForeign = banks.findIndex((bank) => bank.id === "hsbc")
const INSTITUTIONS = [...banks.slice(0, firstForeign), ...eWallets].map((item) => item.shortName)

/** How names of Vietnamese words are said, which the model writes with their accents. */
const SAID: Record<string, string[]> = {
  "Nam A Bank": ["Nam Á Bank"],
  "Bac A Bank": ["Bắc Á Bank"],
  "DongA Bank": ["Đông Á Bank"],
  "BaoViet Bank": ["Bảo Việt Bank"],
  "VietABank": ["Việt Á Bank"],
  "KienlongBank": ["Kiên Long Bank"],
  "OceanBank": ["Ocean Bank"],
  "SeABank": ["Sea Bank"],
  "PVcomBank": ["PVcom Bank"],
  "VinID Pay": ["Vin ID Pay"],
}

/** The ways a name is said, the name itself first: "LPBank" is said as "LP Bank" too. */
function saidAs(name: string) {
  const ways = [name, ...(SAID[name] ?? [])]
  // Letters then "Bank", run together in the brand, apart when said.
  const letters = /^([A-Z]{2,4})Bank$/.exec(name)
  if (letters) ways.push(`${letters[1]} Bank`)
  return ways
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const EDGE_BEFORE = "(?<![\\p{L}\\p{N}])"
const EDGE_AFTER = "(?![\\p{L}\\p{N}])"

/** Letters said one by one, "B I D V", as the one word they spell. */
const SPELLED = new RegExp(`${EDGE_BEFORE}[A-Z](?: [A-Z])+${EDGE_AFTER}`, "gu")

/** Its capitals as a sentence, every way a name is said written as the brand writes it. */
function asSentence(text: string, names: string[]) {
  const spelled = text.replace(SPELLED, (letters) => letters.replace(/ /g, ""))
  // The steady mishearings first ("LP banh" → "LP Bank"), so the brand below finds the name.
  let sentence = normalizeTranscript(spelled.toLocaleLowerCase("vi-VN"))
  // The longest first, so "VNPAY Money" is not taken for "VNPAY"; each through a
  // placeholder, so a name written in is not matched again by a shorter one.
  const ways = names
    .flatMap((name) => saidAs(name).map((way) => ({ way, name })))
    .sort((a, b) => b.way.length - a.way.length)
  const written: string[] = []
  for (const { way, name } of ways) {
    const pattern = way.split(/\s+/).map(escape).join("\\s*")
    sentence = sentence.replace(new RegExp(`${EDGE_BEFORE}${pattern}${EDGE_AFTER}`, "giu"), () => {
      written.push(name)
      return `\u0000${written.length - 1}\u0000`
    })
  }
  sentence = sentence.replace(/\u0000(\d+)\u0000/g, (_, index: string) => written[Number(index)])
  return sentence.charAt(0).toLocaleUpperCase("vi-VN") + sentence.slice(1)
}

/**
 * The words in a recording, with how long the model took on the server. The
 * user's own account names come first among the hotwords, then every bank
 * and wallet, each in the ways it is said.
 */
export async function transcribeOnServer(audio: File, spokenNames: string[], timeoutMs = 15_000) {
  // "ví MoMo" is said with "ví" before the name; the hotword is the name.
  const own = spokenNames.map((name) => name.replace(/^ví\s+/i, "").trim()).filter(Boolean)
  const names = [...new Set([...own, ...INSTITUTIONS])]
  const hotwords = [...new Set(names.flatMap(saidAs))]
  const response = await fetch(`${process.env.STT_URL}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "X-Hotwords": hotwords.map(encodeURIComponent).join("/") },
    body: Buffer.from(await audio.arrayBuffer()),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`stt ${response.status}: ${(await response.text().catch(() => "")).slice(0, 200)}`)
  const result = (await response.json()) as { text?: string; ms?: number }
  const raw = (result.text ?? "").trim()
  return { text: asSentence(raw, names), raw, ms: result.ms ?? 0 }
}
