import { categoryColorOptions } from "@/lib/categories/category-colors"

// Rose reads as money owed, slate as nothing chosen: neither marks a person.
const personColors = categoryColorOptions.filter((color) => color.name !== "rose" && color.name !== "slate")

/**
 * A colour of the category palette per person (FNV-1a of their id), the same
 * on every visit and every page: a class setting `--tile` for `tile-tinted`.
 */
export function personTileClassName(id: string) {
  let hash = 2_166_136_261
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0
  return personColors[hash % personColors.length].tileClassName
}
