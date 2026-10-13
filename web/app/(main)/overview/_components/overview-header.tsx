import Image from "next/image"

import { NotificationsButton } from "@/components/notifications-sheet"
import { PageHeader } from "@/components/page"
import { TimiWordmark } from "@/components/timi-wordmark"
import { Badge } from "@/components/ui/badge"
import type { PlanState } from "@/lib/plans/plans"

/**
 * The top of the overview, as an app opens (2026-10-13): Timi's icon and
 * name, the greeting by the hour under it ("Pro" beside the name on Pro),
 * and the notifications bell. On wider screens the sidebar already shows
 * the logo and the top bar the bell, so the greeting alone is the title.
 * The bar's title stays for screen readers.
 */
export function OverviewHeader({
  planState,
  greeting,
}: {
  planState: PlanState
  /** "Chào buổi sáng"…, by the hour on the server. */
  greeting: string
}) {
  return (
    <PageHeader
      title="Tổng quan"
      lead={
        <div className="flex min-h-11 min-w-0 items-center gap-3">
          <Image src="/icon.svg" alt="" width={40} height={40} priority className="size-10 shrink-0 md:hidden" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 md:hidden">
              <TimiWordmark className="h-[22px]" />
              <span className="sr-only">Timi</span>
              {planState.plan === "pro" ? (
                <Badge variant="ai">Pro</Badge>
              ) : null}
            </span>
            <span className="block truncate text-xs text-muted-foreground md:text-2xl md:leading-8 md:font-semibold md:tracking-tight md:text-foreground">{greeting}</span>
          </span>
        </div>
      }
      tools={<div className="md:hidden"><NotificationsButton /></div>}
    />
  )
}
