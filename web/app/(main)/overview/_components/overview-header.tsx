
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
 * screens the sidebar already shows the logo and Settings and the top bar
 * the bell and the switch, so the greeting alone is the title.
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
            <span className="block truncate text-xs text-muted-foreground md:text-2xl md:leading-8 md:font-semibold md:tracking-tight md:text-foreground">{greeting}</span>
          </span>
        </div>
      }
      tools={
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle size="icon" variant="secondary" />
          <NotificationsButton />
          <Link
            href="/settings"
            aria-label="Cài đặt"
            className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none transition-transform duration-150 select-none active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
          >
            {/* The initials on the plain grey, as on Settings (2026-10-19: the user does not want the lime here). */}
            <Avatar size="lg">
              <AvatarImage src={user.avatar} alt="" />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      }
    />
  )
}
