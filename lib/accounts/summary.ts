import type { Account, BalanceSummary } from "@/lib/accounts/types"

function formatUpdatedAt(value: Date) {
  const time = value.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  })
  const date = value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  })

  return `${time} ${date}`
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
