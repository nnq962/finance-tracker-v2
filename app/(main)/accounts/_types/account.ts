import type { AccountType } from "./account-form"

export type AccountGroupType = "spending" | "saving"

export type Account = {
  id: string
  name: string
  balance: number
  type: AccountType
  provider?: string
  note?: string
  excludeFromReports?: boolean
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
