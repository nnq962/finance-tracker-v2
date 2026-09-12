export type AccountType = "cash" | "bank" | "e-wallet"

export type AccountFormValues = {
  name: string
  type: AccountType
  provider?: string
  balance: number
  note?: string
  excludeFromReports: boolean
}
