export type AccountType = "cash" | "bank" | "e-wallet"

export type AccountStatus = "active" | "archived"

export type AccountFormValues = {
  name: string
  type: AccountType
  institutionId?: string
  balance: number
  note?: string
  /** When the account was opened, as the user says. */
  openedAt: Date
  /** Left out of the totals and the figures (MISA's "Không tính vào báo cáo"). */
  excluded: boolean
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
  /**
   * Left out of the figures: its balance is not in the totals or the net
   * worth, its income and spending not in the monthly figures. It still works.
   */
  excluded: boolean
  /** When the account was opened, as the user says. */
  openedAt: string
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
