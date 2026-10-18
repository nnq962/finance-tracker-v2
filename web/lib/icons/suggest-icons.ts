import { categoryIconOptions, type CategoryIconName } from "./category-icon-registry"
import { iconKeywords } from "./icon-keywords"
import { searchKey } from "@/lib/search-text"

// Words that say nothing about an icon ("Cà phê và trà sữa").
const fillerWords = new Set(["va", "và", "cua", "của", "cho", "cac", "các", "nhung", "những", "voi", "với", "la", "là", "o", "ở"])

/** The words of `text` as `key` compares them, without the filler ones. */
export const wordsOf = (text: string, key: (value: string) => string) =>
  key(text).split(/[\s,.;:()/&+-]+/).filter((word) => word && !fillerWords.has(word))


/**
 * The icons for `name`: those its common words bring up (lib/icons/
 * icon-keywords.ts, "Du lịch Nhật" → Máy bay), then those whose names share
 * words with it ("Cà phê sáng" → Cà phê), those sharing most first. Accents count when the name has them, so
 * "sữa" (milk) does not bring up "sửa" (repairs).
 */
export function suggestIcons(name: string): CategoryIconName[] {
  const key = searchKey(name)
  const words = wordsOf(name, key)
  const typed = new Set(words.filter((word) => word.length > 1))
  if (typed.size === 0) return []
  // Common words first ("du lịch" → Máy bay), matched as whole words in order.
  const text = ` ${words.join(" ")} `
  const fromKeywords = iconKeywords
    .filter(([phrases]) => phrases.some((phrase) => text.includes(` ${wordsOf(phrase, key).join(" ")} `)))
    .flatMap(([, icons]) => icons)
  const fromLabels = categoryIconOptions
    .map((option) => ({ name: option.name, score: wordsOf(option.label, key).filter((word) => typed.has(word)).length }))
    .filter((option) => option.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((option) => option.name)
  return [...new Set([...fromKeywords, ...fromLabels])]
}
