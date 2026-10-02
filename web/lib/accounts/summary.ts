import type { Account, BalanceSummary } from "@/lib/accounts/types"
import { formatDate, formatTime, toDateKey } from "@/lib/format-date"

function formatUpdatedAt(value: Date) {
  return `${formatTime(value)} ${formatDate(toDateKey(value))}`
}

export function getBalanceSummary(accounts: Account[]): BalanceSummary {
  const reportableAccounts = accounts.filter(
    (account) => account.status === "active",
  )
  const totalBalance = reportableAccounts.reduce(
    (total, account) => total + account.balance,
    0,
  )
  const latestUpdatedAt = accounts.reduce<Date | null>((latest, account) => {
    const updatedAt = new Date(account.updatedAt)
    return !latest || updatedAt > latest ? updatedAt : latest
  }, null)

  return {
    totalBalance,
    changePercent: 0,
    accountCount: accounts.length,
    updatedAt: latestUpdatedAt
      ? formatUpdatedAt(latestUpdatedAt)
      : "Chưa có dữ liệu",
    trend: [{ month: "Hiện tại", balance: totalBalance }],
  }
}
