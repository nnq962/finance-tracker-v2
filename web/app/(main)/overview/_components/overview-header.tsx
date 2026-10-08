import { PageHeader } from "@/components/page"
import { formatDayLabel } from "@/lib/format-date"

import { NotificationsButton } from "./notifications-sheet"

/**
 * The top of the overview, as in a phone app's home: today's date, a
 * greeting by the hour and the notifications bell. The small bar that takes
 * over once scrolled names the tab.
 */
export function OverviewHeader({
  greeting,
  today,
}: {
  /** "Chào buổi sáng"…, by the hour on the server. */
  greeting: string
  /** "YYYY-MM-DD", today in Vietnam. */
  today: string
}) {
  return (
    <PageHeader
      eyebrow={<time dateTime={today}>{formatDayLabel(today)}</time>}
      title={greeting}
      compactTitle="Tổng quan"
      accessory={<NotificationsButton />}
    />
  )
}
