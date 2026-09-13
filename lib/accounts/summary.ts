import type { Account, BalanceSummary } from "@/lib/accounts/types"

export function getBalanceSummary(accounts: Account[]): BalanceSummary {
  const reportableAccounts = accounts.filter(
    (account) => account.status === "active" && !account.excludeFromReports,
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
      ? latestUpdatedAt.toLocaleString("vi-VN", {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: "Asia/Ho_Chi_Minh",
        })
      : "Chưa có dữ liệu",
    trend: [{ month: "Hiện tại", balance: totalBalance }],
  }
}
