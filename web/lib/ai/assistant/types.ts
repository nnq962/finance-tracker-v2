import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryIconName } from "@/lib/icons/category-icon-registry"

/* ------------------------------------------------ what a question asks for */

/** What is measured: money out, money in, both, any movement, what accounts hold, what is owed. */
export type Measure = "spending" | "income" | "net" | "transactions" | "balance" | "lent" | "borrowed"

/** How it is shown: one figure, split up, the largest first, or the movements themselves. */
export type View = "total" | "by_group" | "by_category" | "by_account" | "top" | "list"

export type PeriodPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year"
  | "last_days"
  | "month"
  | "year"
  | "range"
  | "all"

export type Compare = "none" | "previous" | "last_year"

/**
 * A question as the model reads it, held to known values and the user's own
 * ids: what the code then works out and shows. Nothing in it is a figure.
 */
export type QuestionPlan = {
  /** False when the question is about something the app does not hold. */
  answerable: boolean
  measure: Measure
  view: View
  period: {
    preset: PeriodPreset
    /** last_days: how many days back from today. */
    days: number | null
    /** month, year: which (the year defaults to the latest that has passed that month). */
    month: number | null
    year: number | null
    /** range: "YYYY-MM-DD", both included. */
    from: string | null
    to: string | null
  }
  compare: Compare
  groupIds: string[]
  categoryIds: string[]
  accountIds: string[]
  contactIds: string[]
  /** Words to find in a transaction's note or category ("phở"). */
  search: string
  /** How many rows a top or a list shows. */
  limit: number | null
}

/* ------------------------------------------------- what the answer shows */

export type AnswerIcon =
  | { kind: "category"; icon: CategoryIconName; color: CategoryColorName }
  | { kind: "initials"; text: string }
  | { kind: "account" }
  | { kind: "transfer" }

export type AnswerRow = {
  icon: AnswerIcon
  name: string
  sub?: string
  /** "late": the sub line warns (a debt past its due date). */
  subTone?: "late"
  amount: number
  /** How the amount reads: money in (green), out (with its minus), or plain. */
  amountTone: "income" | "expense" | "plain"
}

export type AnswerBlock =
  /** Shares of the whole, a bar each, largest first. */
  | { type: "bars"; rows: { icon: AnswerIcon; name: string; amount: number; share: number }[] }
  /** Two periods side by side, the current one first. */
  | { type: "compare"; rows: { label: string; amount: number; share: number }[] }
  /** Rows of movements, people or accounts, in groups that may carry a heading. */
  | { type: "rows"; groups: { heading?: string; rows: AnswerRow[] }[] }

export type Answer = {
  /** What was worked out, in a few words: "Chi tiêu · tháng 10 (1–11/10)". */
  kicker: string
  figure?: { amount: number; tone: "income" | "expense" | "plain" }
  /** Change against the period compared with; up is good for income. */
  delta?: { current: number; previous: number; goodWhen: "up" | "down"; comparedTo: string }
  /** The answer in a sentence, under the figure. */
  line?: string
  blocks: AnswerBlock[]
  /** Questions to ask next, as chips. */
  followUps: string[]
  /** Where to see it all in the app. */
  link?: { label: string; href: string }
}

/* ----------------------------------------------------- the action's reply */

export type AssistantQuota = { used: number; limit: number; credits: number }

/** The turn before, sent back with a follow-up so it can be read in its light: a question's plan, or a chat's reply. */
export type AssistantContext = { question: string; plan?: QuestionPlan; reply?: string }

export type AssistantReply =
  | { kind: "answer"; answer: Answer; plan: QuestionPlan; quota: AssistantQuota }
  /** A transaction to record: the old assistant on the transactions page takes it. */
  | { kind: "record"; text: string }
  /** Something the assistant cannot do yet (a loan, an edit). */
  | { kind: "action" }
  /** A question about what the app does not hold. */
  | { kind: "other" }
  /** LiuLiu's reply to chat; `limited` once the day's chats are used up. */
  | { kind: "chat"; text: string; limited?: boolean }
  | { kind: "quota"; quota: AssistantQuota; proLimit: number; isPro: boolean }
  | { kind: "failed" }
