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

/** Each mission's name, as the overview lists it and the assistant says it. */
export const missionTitles: Record<MissionKey, string> = {
  account: "Thêm tài khoản",
  transaction: "Ghi giao dịch đầu tiên",
  ai: "Ghi giao dịch bằng AI",
  transfer: "Chuyển tiền giữa hai tài khoản",
  contact: "Thêm người liên hệ",
  debt: "Ghi khoản vay hoặc cho vay",
  category: "Tạo hạng mục riêng",
  reminder: "Bật nhắc ghi chi tiêu",
  install: "Cài ứng dụng lên màn hình chính",
}

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
