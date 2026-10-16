/** `savings`: a savings jar ("hũ tiết kiệm"), money put aside for something to buy; it carries `goal`. */
export type AccountType = "cash" | "bank" | "e-wallet" | "savings"

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
  /**
   * Tied to others or to loans (a transfer, a loan, a repayment): it cannot
   * be deleted, as that would change another balance, only archived.
   */
  linked: boolean
  /** When the account was opened, as the user says. */
  openedAt: string
  updatedAt: string
  /** A savings jar's goal (type `savings` only). */
  goal?: SavingsGoal
}

export type SavingsGoal = {
  /** How much is to be put aside. */
  target: number
  /** Its icon, one of the category icons (lib/icons/category-icon-registry). */
  icon: string
  /** Its colour, one of the category colours. */
  color: string
  /** "YYYY-MM-DD", the due month's last day, if one is set. */
  due?: string
  /** When what it was for was bought; the jar is then archived, in "Hũ đã hoàn thành". */
  completedAt?: string
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
