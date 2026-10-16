/** The word typed to confirm wiping all data. */
export const WIPE_CONFIRM_WORD = "XOÁ"

/** XOÁ, XÓA, xoa: the word, whatever the keyboard did with its accent. */
export function isWipeConfirmWord(value: unknown) {
  return typeof value === "string" &&
    value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase() === "XOA"
}
