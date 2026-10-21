
import Link from "next/link"

import { NotificationsButton } from "@/components/notifications-sheet"
import { PageHeader } from "@/components/page"
import { ThemeToggle } from "@/components/theme-toggle"
import { TimiIcon } from "@/components/timi-icon"
import { TimiWordmark } from "@/components/timi-wordmark"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/debts/initials"
import type { PlanState } from "@/lib/plans/plans"

/**
 * The top of the overview, as an app opens (2026-10-13): Timi's icon and
 * name, the greeting by the hour under it ("Pro" beside the name on Pro),
 * then the light / dark switch (2026-10-19), the notifications bell and the
 * person's avatar, which opens Settings (2026-10-20: Settings left the tab
 * bar, as App Store and Revolut keep the account at the top). On wider
 * screens the sidebar already shows the logo, the page's name and Settings,
 * and the top bar the bell and the switch: no row at all (2026-10-21; it
 * held "Tổng quan" with the greeting under it before).
 * The bar's title stays for screen readers.
 */
export function OverviewHeader({
  planState,
  greeting,
  user,
}: {
  planState: PlanState
  /** "Chào buổi sáng"…, by the hour on the server. */
  greeting: string
  user: { name: string; avatar: string }
}) {
  return (
    <>
      {/* From md no row of its own (2026-10-21), as the other pages: the sidebar names the page, the
          top bar holds the bell and the theme; the content starts 16 under the top bar. The name
          stays for screen readers. */}
      <h1 className="sr-only max-md:hidden">Tổng quan</h1>
      <div aria-hidden="true" className="hidden h-4 md:block" />
      <div className="md:hidden">
        <PageHeader
          title="Tổng quan"
          lead={
            <div className="flex min-h-11 min-w-0 items-center gap-3">
              <TimiIcon size={40} priority className="size-10 md:hidden" />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 md:hidden">
                  <TimiWordmark className="text-lg" />
                  {planState.plan === "pro" ? (
                    <Badge variant="ai">Pro</Badge>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{greeting}</span>
              </span>
            </div>
          }
          tools={
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle size="icon" variant="elevated" />
              <NotificationsButton />
              <Link
                href="/settings"
                aria-label="Cài đặt"
                className="pressable flex size-11 shrink-0 items-center justify-center rounded-full outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {/* The initials in ink (white in the dark theme), as on Settings; the user wanted neither lime nor grey here (2026-10-20). */}
                <Avatar size="lg">
                  <AvatarImage src={user.avatar} alt="" />
                  <AvatarFallback inverse>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          }
        />
      </div>
    </>
  )
}
