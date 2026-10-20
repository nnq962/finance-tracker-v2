/** The word typed to confirm wiping all data. */
export const WIPE_CONFIRM_WORD = "XOÁ"
/** The words typed to confirm deleting the account itself. */
export const DELETE_ACCOUNT_WORD = "XOÁ TÀI KHOẢN"

/** The text with its accents stripped, spaces squeezed, upper-cased: what the keyboard did with the accents does not matter. */
function plain(value: unknown) {
  return typeof value === "string" ? value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ").trim().toUpperCase() : ""
}

/** XOÁ, XÓA, xoa: the word, whatever the keyboard did with its accent. */
export function isWipeConfirmWord(value: unknown) {
  return plain(value) === "XOA"
}

export function isDeleteAccountWord(value: unknown) {
  return plain(value) === "XOA TAI KHOAN"
}
