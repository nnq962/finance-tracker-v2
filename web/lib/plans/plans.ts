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

/**
 * Below this payOS is not worth opening (and a payment must be above 0), so
 * a coupon that brings the price this low grants Pro at once instead.
 */
export const MIN_CHECKOUT_AMOUNT = 2_000

/**
 * The price of a period after a coupon, rounded to the nearest 1.000đ so it
 * reads cleanly (35% off 29.000đ is 19.000đ, not 18.850đ), and what that
 * takes off.
 */
export function priceWithCoupon(period: PlanPeriod, percentOff: number) {
  const listAmount = proPrices[period].amount
  const amount = Math.round((listAmount * (100 - percentOff)) / 100 / 1_000) * 1_000
  return { listAmount, discount: listAmount - amount, amount }
}

/** A user's plan now: Pro until `proEndsAt` (ISO), else free. */
export type PlanState = {
  plan: PlanName
  proEndsAt?: string
  /** AI requests this Vietnam calendar month, and the plan's limit. */
  aiUsed: number
  aiLimit: number
  /** AI credits earned from missions, used once the month's requests run out. */
  aiCredits: number
  /** Every credit earned from missions, so what is left can be shown against it. */
  aiCreditsEarned: number
}

/** What a user writes on a transfer, so the payment can be matched to them. */
export function paymentReference(userId: string) {
  return `FT ${userId.slice(0, 8).toUpperCase()}`
}
