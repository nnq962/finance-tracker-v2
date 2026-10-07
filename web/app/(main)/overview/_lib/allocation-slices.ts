import { CircleHelpIcon, EllipsisIcon, type LucideIcon } from "lucide-react"

import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryType } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import type { MonthAllocation } from "@/lib/overview/month-data"

// Five groups and the rest folded into one neutral "Khác" slice.
const MAX_SLICES = 5
const OTHER_COLOR: CategoryColorName = "slate"

export type AllocationSlice = {
  key: string
  icon: LucideIcon
  name: string
  amount: number
  /** Whole percent of the month's total. */
  share: number
  color: CategoryColorName
  fill: string
}

/**
 * A month's income or expenses per category group, largest first: five
 * groups and the rest as "Khác". Loans are not in the totals: borrowing and
 * lending are not income or spending.
 */
export function allocationSlices(
  categoryGroups: CategoryGroup[],
  allocation: Record<string, MonthAllocation>,
  month: string,
  type: CategoryType,
) {
  const groupsById = new Map(categoryGroups.map((group) => [group.id, group]))
  const totals = Object.entries(allocation[month]?.[type] ?? {})
  const total = totals.reduce((sum, [, amount]) => sum + amount, 0)
  const ranked = totals.sort((left, right) => right[1] - left[1])
  const visible = ranked.length > MAX_SLICES + 1 ? ranked.slice(0, MAX_SLICES) : ranked
  const restAmount = ranked.slice(visible.length).reduce((sum, [, amount]) => sum + amount, 0)
  const toShare = (amount: number) => (total > 0 ? Math.round((amount / total) * 100) : 0)

  const slices: AllocationSlice[] = visible.map(([key, amount]) => {
    const group = groupsById.get(key)
    const color = group?.colorName ?? OTHER_COLOR
    return {
      key,
      icon: group ? categoryIconRegistry[group.iconName] : CircleHelpIcon,
      name: group?.name ?? "Chưa phân loại",
      amount,
      share: toShare(amount),
      color,
      fill: getCategoryColor(color).chartFill,
    }
  })
  if (restAmount > 0) {
    slices.push({
      key: "rest",
      icon: EllipsisIcon,
      name: `Khác (${ranked.length - visible.length} nhóm)`,
      amount: restAmount,
      share: toShare(restAmount),
      color: OTHER_COLOR,
      fill: getCategoryColor(OTHER_COLOR).chartFill,
    })
  }

  return { slices, total }
}
