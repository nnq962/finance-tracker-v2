/** Lower case, without accents, đ as d: "Đi lại" → "di lai". */
export function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi-VN")
}

/** Whether a query is typed with accents (or đ), and so means them. */
export function hasAccents(value: string) {
  return /[\u0300-\u036f]|[đĐ]/.test(value.normalize("NFD"))
}

/**
 * How text is compared with a query, as Vietnamese apps search: typed with
 * accents, the accents count ("ăn" finds "Ăn trưa", not "khoản" or "Lan");
 * typed without, they do not ("an" finds all three). Case never counts.
 */
export function searchKey(query: string): (value: string) => string {
  if (hasAccents(query)) return (value) => value.normalize("NFC").toLocaleLowerCase("vi-VN")
  return normalizeSearchValue
}
