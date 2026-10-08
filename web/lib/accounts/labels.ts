import type { Account, AccountType } from "./types"

export const accountTypeLabels: Record<AccountType, string> = {
  bank: "Ngân hàng",
  "e-wallet": "Ví điện tử",
  cash: "Tiền mặt",
}

/** An account's type, and its bank or wallet, leaving out what its name already says: "Ví điện tử · MoMo". */
export function accountDescription(account: Pick<Account, "type" | "name" | "institutionName">) {
  const type = accountTypeLabels[account.type]
  if (account.institutionName && account.institutionName !== account.name) return `${type} · ${account.institutionName}`
  return type === account.name ? undefined : type
}
