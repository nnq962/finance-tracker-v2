import { AppHeader } from "@/components/app/app-header"
import { NotificationsButton } from "@/components/notifications-sheet"

import { TodayPill } from "./today-pill"

/**
 * The top of the overview on phones (2026-10-24, the user's picture): the
 * bar every page has, with the person on the left (Settings; the PRO label on
 * Pro), today as a pill in the middle and the bell on the right; under it the
 * greeting by the hour and the person's name, large. Timi's logo and the
 * theme switch left it (the switch is in Settings). On wider screens the
 * sidebar shows the page's name and Settings, and the top bar the bell and
 * the switch: no row at all (2026-10-21). The name stays for screen readers.
 */
export function OverviewHeader({
  greeting,
  user,
  today,
}: {
  /** "Chào buổi sáng"…, by the hour on the server. */
  greeting: string
  user: { name: string }
  /** "YYYY-MM-DD" in Vietnam time. */
  today: string
}) {
  return (
    // Each part on its own in the page, so the page's 24 opens under the name.
    <>
      <h1 className="sr-only">Tổng quan</h1>
      <div aria-hidden="true" className="hidden h-4 md:block" />
      <div className="md:hidden">
        <AppHeader center={<TodayPill today={today} />} actions={<NotificationsButton />} />
        <p className="px-1 text-[15px] text-muted-foreground">{greeting},</p>
        <p className="mt-0.5 flex items-center gap-2 px-1 text-[28px] leading-9 font-bold tracking-tight">
          <span className="min-w-0 truncate">{user.name}</span>
          <span aria-hidden="true">👋</span>
        </p>
      </div>
    </>
  )
}
