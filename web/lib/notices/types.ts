import type { AppEvent } from "@/lib/app-events"

/** What a notice is about, which sets its icon and colour. */
export type NoticeKind = "debt-due" | "debt-overdue" | "unrecorded" | "missions" | "ai" | "pro" | "negative" | "release" | "broadcast"

/** An in-app notice, worked out from the user's data (lib/notices/notices.ts). */
export type Notice = {
  /** Names the thing and its moment ("debt:<id>:<due date>"), so reading it marks just that. */
  key: string
  kind: NoticeKind
  title: string
  body: string
  /** When it came, an ISO moment. */
  at: string
  read: boolean
  /** What a tap opens: a page, a sheet on its page, or what a version brought. */
  opens?: { href: string } | { event: AppEvent } | { release: string }
}
