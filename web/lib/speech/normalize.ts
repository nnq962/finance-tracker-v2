/**
 * Puts right what speech recognisers steadily get wrong in bank and wallet
 * names, learned from the voice lab's name test (each name read three times
 * through Whisper and the browser's recogniser on an iPhone). Only mistakes
 * that came back the same way more than once, and that no ordinary sentence
 * would hold, are here: "bánh" is left alone unless a bank's name comes before it.
 */

// Word edges that know Vietnamese letters; \b only knows ASCII.
const START = "(?<![\\p{L}\\p{N}])"
const END = "(?![\\p{L}\\p{N}])"

const word = (pattern: string) => new RegExp(`${START}(?:${pattern})${END}`, "giu")

/** A bank's name before a misheard "bank": "Đông Á Banh", "Kiên Long Bành", "Bảo Việt bảnh". */
const BANK_STEMS = [
  "đông á",
  "đông a",
  "nam á",
  "nam a",
  "bắc á",
  "bắc a",
  "việt á",
  "việt a",
  "bảo việt",
  "kiên long",
  "ocean",
  "sea",
  "pvcom",
  "ab",
  "bv",
  "gp",
  "hd",
  "lp",
  "mb",
  "pg",
  "tp",
  "vp",
]
const MISHEARD_BANK = "banh|bánh|bành|bảnh|bang|bàng|vank|vành|ban|mạnh"

const replacements: [RegExp, string][] = [
  [new RegExp(`${START}(${BANK_STEMS.join("|")})\\.?\\s*(?:${MISHEARD_BANK})${END}`, "giu"), "$1 Bank"],
  [word("teccombank|tegcombank|tết con bánh"), "Techcombank"],
  [word("mêgabyte bank|megabyte bank|maybe bank|mobibank|mobi ling|mbbank"), "MB Bank"],
  [word("viettinbank"), "VietinBank"],
  [word("agbank"), "Agribank"],
  [word("time bank|thì mê bank|tim bank|tìm mê bank"), "TymeBank"],
  [word("ví mô mô|vimomo|vietmo|ví mômô"), "ví MoMo"],
  [word("mômô|mô mô|môm"), "MoMo"],
  [word("zalo pay"), "ZaloPay"],
  [word("shopee pay|sopipay|sopi pay|sopi bay"), "ShopeePay"],
  [word("grab pay|grappay"), "GrabPay"],
  [word("vienpay|vn pay"), "VNPAY"],
  [word("chu money|chú money|true money"), "TrueMoney"],
  [word("next pay"), "NextPay"],
  [word("vin id pay|vn id pay"), "VinID Pay"],
  [word("vtcpay|vt c pay"), "VTC Pay"],
]

/** Single letters spelled out with dots, dashes or commas between: "V.I.B." → "VIB", "S, C, B" → "SCB". */
const SPELLED = new RegExp(`${START}(\\p{Lu}(?:[.\\-,]\\s?\\p{Lu}){1,4})\\.?${END}`, "gu")

/** "VTBank, VTBank, VTBank" → "VTBank": a recogniser stuck on one name. */
function collapseRepeats(text: string) {
  const parts = text.split(/,\s*/)
  const key = (part: string) => part.trim().replace(/[.!?]+$/, "").toLowerCase()
  return parts.filter((part, index) => index === 0 || key(part) !== key(parts[index - 1])).join(", ")
}

export function normalizeTranscript(text: string) {
  let result = collapseRepeats(text)
  result = result.replace(SPELLED, (spelled: string) => spelled.replace(/[.\-,\s]/g, ""))
  for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement)
  return result.replace(/\s+/g, " ").trim()
}
