import Link from "next/link"
import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react"

import { NotificationsButton } from "@/components/notifications-sheet"
import { PageHeader } from "@/components/page"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { SessionUser } from "@/lib/auth/session"
import type { PlanState } from "@/lib/plans/plans"

import { initialsOf } from "../_lib/greeting"

/**
 * The top of the overview, as Vietnamese banking apps open: the user's avatar
 * with a greeting by the hour over their name (the tick on Pro), which opens
 * Cài đặt, and the notifications bell (on wider screens it sits in the top
 * bar, by the theme switch). The bar's title stays for screen readers.
 */
export function OverviewHeader({
  user,
  planState,
  greeting,
}: {
  user: SessionUser
  planState: PlanState
  /** "Chào buổi sáng"…, by the hour on the server. */
  greeting: string
}) {
  // The full name as Google gives it: its order says nothing of which part is the given name.
  const name = user.name.trim() || "bạn"

  return (
    <PageHeader
      title="Tổng quan"
      lead={
        <Link
          href="/settings"
          aria-label={`Hồ sơ của bạn, ${name}`}
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-60"
        >
          <Avatar size="lg">
            <AvatarImage src={user.avatar} alt="" />
            <AvatarFallback colorKey={user.uid}>{initialsOf(name) || "?"}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">{greeting}</span>
            <span className="flex min-w-0 items-center gap-1 text-base leading-snug font-semibold">
              <span className="truncate">{name}</span>
              {planState.plan === "pro" ? (
                <BadgeCheckIcon className="size-4 shrink-0 fill-ai text-ai-foreground" role="img" aria-label="Pro" />
              ) : null}
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </span>
          </span>
        </Link>
      }
      tools={<div className="md:hidden"><NotificationsButton /></div>}
    />
  )
}
