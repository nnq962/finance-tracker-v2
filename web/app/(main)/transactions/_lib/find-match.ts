import { searchKey } from "@/lib/search-text"

/**
 * Where `query` first appears in `text`, matched as the search matches
 * (searchKey): accents counting only when typed, any case. The range is in
 * the characters of `text` composed (NFC), the form to mark it in; null
 * when it does not appear.
 */
export function findMatch(text: string, query: string): { start: number; end: number } | null {
  const key = searchKey(query)
  const needle = key(query.trim())
  if (!needle) return null

  // Each character normalised on its own, remembering where it came from, so
  // a match in the normalised text maps back to the original.
  let normalized = ""
  const origin: number[] = []
  const source = text.normalize("NFC")
  for (let index = 0; index < source.length; index++) {
    const part = key(source[index])
    normalized += part
    for (let k = 0; k < part.length; k++) origin.push(index)
  }

  const found = normalized.indexOf(needle)
  if (found === -1) return null
  return { start: origin[found], end: origin[found + needle.length - 1] + 1 }
}
