import { BanknoteIcon, LandmarkIcon, SmartphoneIcon, type LucideIcon } from "lucide-react"

import {
  getCategoryColor,
  type CategoryColorName,
} from "@/lib/categories/category-colors"

import type { Account, AccountType } from "./types"

export const accountTypeLabels: Record<AccountType, string> = {
  bank: "Ngân hàng",
  "e-wallet": "Ví điện tử",
  cash: "Tiền mặt",
}

// Hues from the category palette, whose chart fills are checked to stay apart.
const accountTypeStyles: Record<AccountType, { color: CategoryColorName; icon: LucideIcon }> = {
  bank: { color: "blue", icon: LandmarkIcon },
  "e-wallet": { color: "violet", icon: SmartphoneIcon },
  cash: { color: "emerald", icon: BanknoteIcon },
}

function formatShare(amount: number, total: number) {
  const percentage = total > 0 ? amount / total * 100 : 0
  return `${percentage > 0 && percentage < 1 ? "<1" : Math.round(percentage)}%`
}

/**
 * The active accounts, largest balance first, and the same accounts grouped by
 * type, largest total first. Shares are of the active accounts' total.
 */
export function getAccountDistribution(accounts: Account[]) {
  const activeAccounts = accounts.filter((account) => account.status === "active")
  const accountsTotal = activeAccounts.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  )
  const distribution = activeAccounts
    .map((account) => ({
      ...account,
      distributionBalance: Math.max(account.balance, 0),
      percentageLabel: formatShare(Math.max(account.balance, 0), accountsTotal),
    }))
    .sort((left, right) => right.distributionBalance - left.distributionBalance)

  const groups = (Object.keys(accountTypeLabels) as AccountType[])
    .map((type) => {
      const typeAccounts = distribution.filter((account) => account.type === type)
      const total = typeAccounts.reduce(
        (sum, account) => sum + account.distributionBalance,
        0,
      )
      const { color, icon } = accountTypeStyles[type]

      return {
        type,
        label: accountTypeLabels[type],
        color,
        icon,
        fill: getCategoryColor(color).chartFill,
        total,
        percentageLabel: formatShare(total, accountsTotal),
        accounts: typeAccounts,
      }
    })
    .filter((group) => group.accounts.length > 0)
    .sort((left, right) => right.total - left.total)

  return { distribution, groups, accountsTotal }
}
