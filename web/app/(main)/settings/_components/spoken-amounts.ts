/**
 * The sums in a sentence as numbers, written in digits ("45k", "1 triệu 2",
 * "520.000") or in words as the server recogniser writes them ("bốn nhăm ca",
 * "ba triệu rưỡi", "hai trăm bốn chín nghìn"), with the forms people use for
 * money ("củ", "lít"). For the voice lab to mark what each recogniser heard
 * against the sum read out; not for entering money.
 */

const DIGITS: Record<string, number> = {
  không: 0,
  một: 1,
  mốt: 1,
  hai: 2,
  ba: 3,
  bốn: 4,
  tư: 4,
  năm: 5,
  lăm: 5,
  nhăm: 5,
  sáu: 6,
  bảy: 7,
  bẩy: 7,
  tám: 8,
  chín: 9,
}

/** The multiplier a word stands for: thousand, million, billion, or 100k for "lít". */
const SCALES: Record<string, number> = {
  k: 1e3,
  ca: 1e3,
  nghìn: 1e3,
  ngàn: 1e3,
  nghin: 1e3,
  ngan: 1e3,
  lít: 1e5,
  triệu: 1e6,
  tr: 1e6,
  củ: 1e6,
  tỷ: 1e9,
  tỉ: 1e9,
}

type Token = { kind: "digit"; value: number } | { kind: "number"; value: number } | { kind: "word"; word: string }

function tokenize(text: string): Token[] {
  const words = text
    .toLocaleLowerCase("vi-VN")
    // "45k", "15tr" → "45 k", "15 tr"; "1.200.000" → "1200000"; "3,5" → "3.5".
    .replace(/(\d)\.(?=\d{3}(?!\d))/g, "$1")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d)đ(?![\p{L}])/gu, "$1")
    .replace(/(\d)(k|tr|củ|triệu|nghìn|ngàn)(?![\p{L}])/gu, "$1 $2")
    .split(/[^\p{L}\p{N}.]+/u)
    .filter(Boolean)
  return words.map((word) => {
    if (/^\d+(\.\d+)?$/.test(word)) return { kind: "number", value: Number(word) }
    if (word in DIGITS) return { kind: "digit", value: DIGITS[word] }
    return { kind: "word", word: word.replace(/\.$/, "") }
  })
}

/**
 * A number under a thousand in words: "bốn mươi lăm" 45, "bốn nhăm" 45,
 * "năm trăm hai mươi" 520, "hai trăm bốn chín" 249, "một trăm linh năm" 105.
 */
function smallNumber(words: (number | string)[]): number | null {
  if (words.length === 0) return null
  let value = 0
  let rest = words
  const hundred = rest.indexOf("trăm")
  if (hundred >= 0) {
    const before = rest.slice(0, hundred)
    value = (before.length === 1 && typeof before[0] === "number" ? before[0] : 1) * 100
    rest = rest.slice(hundred + 1)
    // "hai trăm tư": a lone digit after the hundreds is the tens.
    if (rest.length === 1 && typeof rest[0] === "number") return value + rest[0] * 10
  }
  if (rest[0] === "linh" || rest[0] === "lẻ") return typeof rest[1] === "number" ? value + rest[1] : value
  const tens = rest.findIndex((word) => word === "mươi" || word === "mười")
  if (tens >= 0) {
    const before = rest[tens - 1]
    const after = rest[tens + 1]
    const ten = rest[tens] === "mười" ? 1 : typeof before === "number" ? before : 1
    return value + ten * 10 + (typeof after === "number" ? after : 0)
  }
  const digits = rest.filter((word): word is number => typeof word === "number")
  if (digits.length === 2) return value + digits[0] * 10 + digits[1]
  if (digits.length === 1) return value + digits[0]
  return value || null
}

/** Every sum in the text, each as a number of đồng. */
export function spokenAmounts(text: string): number[] {
  const tokens = tokenize(text)
  const amounts: number[] = []
  let index = 0
  while (index < tokens.length) {
    // Gather a number: digits, or number words up to a scale word.
    let total = 0
    let found = false
    let lastScale = 0
    while (index < tokens.length) {
      const words: (number | string)[] = []
      let base: number | null = null
      while (index < tokens.length) {
        const token = tokens[index]
        if (token.kind === "number" && words.length === 0 && base === null) base = token.value
        else if (token.kind === "digit") words.push(token.value)
        else if (token.kind === "word" && ["trăm", "mươi", "mười", "linh", "lẻ"].includes(token.word)) words.push(token.word)
        else break
        index++
      }
      const value = base ?? smallNumber(words)
      const next = tokens[index]
      const scale = next?.kind === "word" ? SCALES[next.word] : undefined
      if (value !== null && scale) {
        total += value * scale
        lastScale = scale
        found = true
        index++
        // "ba triệu rưỡi": half of the scale more.
        if (tokens[index]?.kind === "word" && (tokens[index] as { word: string }).word === "rưỡi") {
          total += scale / 2
          index++
        }
        continue
      }
      if (value !== null && found && lastScale >= 1e3) {
        // "1 triệu 2", "4 triệu 500", "1 củ 5": what follows the scale is a share of it.
        const digitsCount = String(Math.round(value)).length
        total += value * (lastScale / 10 ** digitsCount)
      } else if (value !== null && !found && value >= 1000) {
        // A sum in plain digits, "520000".
        total = value
        found = true
      }
      break
    }
    if (found) amounts.push(Math.round(total))
    else index++
  }
  return amounts
}
