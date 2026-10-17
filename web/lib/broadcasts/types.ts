/** Where a broadcast shows: in the bell and pushed, or only one of them. */
export type BroadcastChannel = "both" | "bell" | "push"

/** Who it goes to, as they stand when it is sent. */
export type BroadcastAudience = "all" | "free" | "pro" | "new"

/** What a tap on it opens. */
export type BroadcastOpens = "none" | "overview" | "transactions" | "budget" | "debts" | "budgets" | "plans" | "release"

export const BROADCAST_TITLE_MAX = 60
export const BROADCAST_BODY_MAX = 200

export const broadcastChannelLabels: Record<BroadcastChannel, string> = {
  both: "Chuông + đẩy",
  bell: "Chỉ chuông",
  push: "Chỉ đẩy",
}

export const broadcastAudienceLabels: Record<BroadcastAudience, string> = {
  all: "Tất cả người dùng",
  free: "Gói Free",
  pro: "Gói Pro",
  new: "Mới tham gia (30 ngày)",
}

export const broadcastAudiences = Object.keys(broadcastAudienceLabels) as BroadcastAudience[]

export const broadcastDestinations: { value: BroadcastOpens; label: string }[] = [
  { value: "none", label: "Chỉ mở app" },
  { value: "overview", label: "Tổng quan" },
  { value: "transactions", label: "Giao dịch" },
  { value: "budget", label: "Ngân sách" },
  { value: "debts", label: "Vay nợ" },
  { value: "budgets", label: "Hạn mức chi tiêu" },
  { value: "plans", label: "Gói Pro" },
  { value: "release", label: "Có gì mới (bản mới nhất)" },
]

/** How many an audience reaches now: people, devices a push goes to, people who turned "Tin từ Timi" off. */
export type BroadcastReach = { people: number; devices: number; optedOut: number }

export type BroadcastInput = {
  title: string
  body: string
  opens: BroadcastOpens
  channel: BroadcastChannel
  audience: BroadcastAudience
  /** Later, an ISO moment; null sends now. */
  sendAt: string | null
}

/** A broadcast in the admin's history. */
export type BroadcastItem = {
  id: string
  title: string
  body: string
  opens: BroadcastOpens
  channel: BroadcastChannel
  audience: BroadcastAudience
  sendAt: string
  status: "scheduled" | "sending" | "sent" | "revoked"
  revokedAt: string | null
  /** Recipients, once sent. */
  people: number
  /** Pushes: sent, out of those due (failed and removed ones included), and those still to go. */
  devices: { sent: number; total: number; failed: number; removed: number; pending: number }
  /** Recipients who read it in the bell. */
  read: number
}

export type BroadcastScreenData = {
  items: BroadcastItem[]
  reach: Record<BroadcastAudience, BroadcastReach>
}
