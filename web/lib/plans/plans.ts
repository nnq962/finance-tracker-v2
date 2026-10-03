export type PlanName = "free" | "pro"

export type PlanPeriod = "month" | "year"

/** What each plan allows. Everything else in the app is the same on both. */
export const plans = {
  free: { label: "Free", aiMonthlyLimit: 15 },
  pro: { label: "Pro", aiMonthlyLimit: 300 },
} as const satisfies Record<PlanName, { label: string; aiMonthlyLimit: number }>

/** Pro's price, in VND, and how long each payment lasts. */
export const proPrices = {
  month: { label: "1 tháng", amount: 29_000, months: 1 },
  year: { label: "1 năm", amount: 249_000, months: 12 },
} as const satisfies Record<PlanPeriod, { label: string; amount: number; months: number }>

/** A user's plan now: Pro until `proEndsAt` (ISO), else free. */
export type PlanState = {
  plan: PlanName
  proEndsAt?: string
  /** AI requests this Vietnam calendar month, and the plan's limit. */
  aiUsed: number
  aiLimit: number
}

/** What a user writes on a transfer, so the payment can be matched to them. */
export function paymentReference(userId: string) {
  return `FT ${userId.slice(0, 8).toUpperCase()}`
}
