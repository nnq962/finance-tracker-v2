import { normalizeSearchValue } from "./filter-transactions"

/**
 * Where `query` first appears in `text`, matched as the search matches: no
 * accents, any case ("an" finds "Ăn"). The range is in `text`'s own
 * characters, to mark it there; null when it does not appear.
 */
export function findMatch(text: string, query: string): { start: number; end: number } | null {
  const needle = normalizeSearchValue(query.trim())
  if (!needle) return null

  // Each character normalised on its own, remembering where it came from, so
  // a match in the normalised text maps back to the original.
  let normalized = ""
  const origin: number[] = []
  for (let index = 0; index < text.length; index++) {
    const part = normalizeSearchValue(text[index])
    normalized += part
    for (let k = 0; k < part.length; k++) origin.push(index)
  }

  const found = normalized.indexOf(needle)
  if (found === -1) return null
  return { start: origin[found], end: origin[found + needle.length - 1] + 1 }
}
