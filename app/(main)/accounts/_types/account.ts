export type AccountGroupType = "spending" | "saving"

export type Account = {
  id: string
  name: string
  balance: number
  logoUrl?: string
  logoFallback: string
  group: AccountGroupType
}

export type AccountGroup = {
  type: AccountGroupType
  title: string
  description?: string
  accounts: Account[]
}

export type BalanceSummary = {
  totalBalance: number
  changePercent: number
  accountCount: number
  updatedAt: string
  trend: {
    month: string
    balance: number
  }[]
}
