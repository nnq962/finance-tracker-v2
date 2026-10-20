export const feedbackKinds = ["idea", "bug", "praise", "other"] as const
export type FeedbackKind = (typeof feedbackKinds)[number]

export const feedbackKindLabels: Record<FeedbackKind, string> = {
  idea: "Góp ý",
  bug: "Báo lỗi",
  praise: "Khen",
  other: "Khác",
}

export const FEEDBACK_MAX_LENGTH = 2000
