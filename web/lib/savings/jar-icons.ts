import { PiggyBankIcon } from "lucide-react"

import type { SavingsGoal } from "@/lib/accounts/types"
import { categoryColorOptions, type CategoryColorName } from "@/lib/categories/category-colors"
import { categoryIconRegistry, type CategoryIconName } from "@/lib/icons/category-icon-registry"

/**
 * A savings jar's look (2026-10-16): an icon from the app's category icons
 * and a category colour, both chosen in its form as a category's are. Until
 * then a jar had one of 20 ideas of its own that also gave its colour; the
 * migration 20261016000001_jar_icon_color moved them over.
 */
export const DEFAULT_JAR_ICON: CategoryIconName = "piggy-bank"
export const DEFAULT_JAR_COLOR: CategoryColorName = "orange"

const colors = new Set<string>(categoryColorOptions.map((color) => color.name))

export function isJarIconName(name: string): name is CategoryIconName {
  return Object.hasOwn(categoryIconRegistry, name)
}

export function isJarColorName(name: string): name is CategoryColorName {
  return colors.has(name)
}

/** A jar's icon and colour; one no longer known shows as an orange piggy bank. */
export function getJarIcon(goal: Pick<SavingsGoal, "icon" | "color"> | undefined) {
  return {
    icon: goal && isJarIconName(goal.icon) ? categoryIconRegistry[goal.icon] : PiggyBankIcon,
    tone: goal && isJarColorName(goal.color) ? goal.color : DEFAULT_JAR_COLOR,
  }
}
