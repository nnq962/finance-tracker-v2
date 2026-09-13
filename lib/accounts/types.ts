export type AccountType = "cash" | "bank" | "e-wallet"

export type AccountStatus = "active" | "archived"

export type AccountFormValues = {
  name: string
  type: AccountType
  institutionId?: string
  balance: number
  note?: string
  excludeFromReports: boolean
}

export type Account = {
  id: string
  name: string
  balance: number
  type: AccountType
  institutionId?: string
  institutionName?: string
  note?: string
  excludeFromReports?: boolean
  logoUrl?: string
  logoFallback: string
  status: AccountStatus
  updatedAt: string
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

export type AccountActionResult =
  | { success: true }
  | { success: false; error: string }
