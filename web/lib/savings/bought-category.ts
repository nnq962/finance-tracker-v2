import { suggestIcons, wordsOf } from "@/lib/icons/suggest-icons"
import { searchKey } from "@/lib/search-text"

import { DEFAULT_JAR_ICON } from "./jar-icons"

type Item = { id: string; name: string; iconName: string }
type Group = { name: string; iconName: string; items: Item[] }

// Icons that mean the same kind of thing, so a phone jar finds "Đồ công nghệ" (a laptop icon).
const families: string[][] = [
  ["smartphone", "laptop", "devices", "phone", "tv"],
  ["car", "motorbike", "bike", "bus", "taxi", "fuel", "parking"],
  ["plane", "plane-takeoff", "plane-landing", "luggage", "baggage", "umbrella", "hotel", "caravan", "sailboat", "ship"],
  ["graduation", "school", "book", "book-check", "library", "languages", "notebook"],
  ["house", "building", "sofa", "armchair", "paint-roller", "hammer", "key", "bed", "lamp", "refrigerator", "washing-machine", "microwave", "fan", "package"],
  ["shirt", "glasses", "sparkles"],
  ["stethoscope", "hospital", "heart", "pill", "cross"],
  ["gift", "party", "cake-basic", "heart-basic"],
  ["paw", "dog", "cat"],
  ["dumbbell", "activity", "trophy"],
  ["gamepad", "ticket", "music", "film", "popcorn"],
]
const familyOf = (icon: string) => families.find((family) => family.includes(icon)) ?? [icon]

// Words in a jar's name that say nothing about what it buys.
const vague = new Set(["mua", "moi", "mới", "do", "đồ", "tien", "tiền", "quy", "quỹ", "hu", "hũ", "cho", "tiet", "tiết", "kiem", "kiệm", "de", "để", "danh", "dành"])

const isShopping = (group: Group) => group.iconName === "shopping-bag" || /mua sắm/i.test(group.name)

/**
 * The expense category to start with when a jar's thing is bought
 * (2026-10-18: a motorbike jar came out as "Quần áo", the first item under
 * Mua sắm). Each item is scored: the jar's own icon (3; the default piggy
 * bank says nothing), an icon of the same kind as the jar's or its name's
 * ("iPhone" → Đồ công nghệ, 2), its name sharing a word with the jar's (2;
 * short words like "xe" are shared by unrelated things), and being under
 * shopping (1, and the winner of a tie). Below 3 nothing is guessed and the
 * user picks, rather than a wrong category ready to save.
 */
export function guessBoughtCategory(jar: { name: string; goal?: { icon: string } }, groups: Group[]) {
  const key = searchKey(jar.name)
  const jarWords = new Set(wordsOf(jar.name, key).filter((word) => word.length > 1 && !vague.has(word)))
  const chosen = jar.goal?.icon && jar.goal.icon !== DEFAULT_JAR_ICON ? jar.goal.icon : null
  // Suggested from the telling words only: "mua" alone would bring up shopping.
  const suggested = suggestIcons([...jarWords].join(" ")).slice(0, 3)
  const kinds = new Set([chosen, ...suggested].filter(Boolean).flatMap((icon) => familyOf(icon!)))

  let best: { id: string; score: number; shopping: boolean } | null = null
  for (const group of groups) {
    const shopping = isShopping(group)
    for (const item of group.items) {
      let score = 0
      if (wordsOf(item.name, key).some((word) => jarWords.has(word))) score += 2
      if (chosen && item.iconName === chosen) score += 3
      else if (kinds.has(item.iconName)) score += 2
      if (shopping) score += 1
      if (!best || score > best.score || (score === best.score && shopping && !best.shopping)) best = { id: item.id, score, shopping }
    }
  }
  return best && best.score >= 3 ? best.id : ""
}
