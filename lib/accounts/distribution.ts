import type { Account } from "./types"

const accountColors = [
  "#2563EB",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#84CC16",
] as const

export function getAccountDistribution(accounts: Account[]) {
  const activeAccounts = accounts.filter((account) => account.status === "active")
  const accountsTotal = activeAccounts.reduce(
    (total, account) => total + Math.max(account.balance, 0),
    0,
  )
  const distribution = activeAccounts.map((account, index) => {
    const distributionBalance = Math.max(account.balance, 0)
    const percentage = accountsTotal > 0 ? distributionBalance / accountsTotal * 100 : 0

    return {
      ...account,
      distributionBalance,
      fill: accountColors[index % accountColors.length],
      percentageLabel: `${percentage > 0 && percentage < 1 ? "<1" : Math.round(percentage)}%`,
    }
  }).sort((left, right) => right.distributionBalance - left.distributionBalance)

  return { distribution, accountsTotal }
}
