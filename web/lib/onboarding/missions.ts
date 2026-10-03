/** AI requests a finished mission earns, once. */
export const MISSION_REWARD = 5

/**
 * The missions on the overview, in the order that walks a new user through
 * the app: money in accounts, recording it, the AI assistant, moving money,
 * the contacts and debts, categories, then the reminder and the app itself.
 */
export const missionKeys = [
  "account",
  "transaction",
  "ai",
  "transfer",
  "contact",
  "debt",
  "category",
  "reminder",
  "install",
] as const

export type MissionKey = (typeof missionKeys)[number]

/** Known only to the browser (whether the app runs installed); the rest the server reads from the user's data. */
export const clientMissions: readonly MissionKey[] = ["install"]

export function isMissionKey(value: unknown): value is MissionKey {
  return typeof value === "string" && (missionKeys as readonly string[]).includes(value)
}

export type MissionState = {
  /** Done, from the user's data (the browser-only missions read false here). */
  done: Record<MissionKey, boolean>
  /** Rewards already claimed. */
  claimed: MissionKey[]
  /** Unused AI credits. */
  aiCredits: number
}
