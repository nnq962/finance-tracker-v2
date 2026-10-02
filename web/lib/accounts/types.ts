export type AccountType = "cash" | "bank" | "e-wallet"

export type AccountStatus = "active" | "archived"

export type AccountFormValues = {
  name: string
  type: AccountType
  institutionId?: string
  balance: number
  note?: string
}

export type Account = {
  id: string
  name: string
  openingBalance: number
  balance: number
  type: AccountType
  institutionId?: string
  institutionName?: string
  note?: string
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
