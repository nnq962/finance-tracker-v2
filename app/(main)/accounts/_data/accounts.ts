import type {
  AccountGroup,
  BalanceSummary,
} from "../_types/account"

export const accountGroups: AccountGroup[] = [
  {
    type: "spending",
    title: "Chi tiêu",
    description: "Các tài khoản sử dụng cho chi tiêu hằng ngày.",
    accounts: [
      {
        id: "vietcombank",
        name: "Vietcombank",
        balance: 68_250_000,
        type: "bank",
        provider: "Vietcombank",
        logoFallback: "VCB",
        group: "spending",
      },
      {
        id: "techcombank",
        name: "Techcombank",
        balance: 42_800_000,
        type: "bank",
        provider: "Techcombank",
        logoFallback: "TCB",
        group: "spending",
      },
      {
        id: "momo",
        name: "MoMo",
        balance: 4_650_000,
        type: "e-wallet",
        provider: "MoMo",
        logoFallback: "M",
        group: "spending",
      },
    ],
  },
]

const allAccounts = accountGroups.flatMap((group) => group.accounts)

export const balanceSummary: BalanceSummary = {
  totalBalance: allAccounts.reduce(
    (total, account) => total + account.balance,
    0,
  ),
  changePercent: 4.2,
  accountCount: allAccounts.length,
  updatedAt: "Hôm nay, 09:15",
  trend: [
    { month: "T5", balance: 94_800_000 },
    { month: "T6", balance: 103_200_000 },
    { month: "T7", balance: 98_400_000 },
    { month: "T8", balance: 111_040_000 },
    { month: "T9", balance: 115_700_000 },
  ],
}
