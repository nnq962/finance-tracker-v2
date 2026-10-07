"use client"

import { BadgeCheckIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { SessionUser } from "@/lib/auth/session"
import type { PlanState } from "@/lib/plans/plans"

import { NotificationsButton } from "./notifications-sheet"
import { initialsOf } from "../_lib/greeting"

/**
 * The top of the overview, as in a phone app's home: the avatar, a greeting
 * with the user's name (the tick on Pro) and the notifications bell.
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
  const name = user.name.trim()

  return (
    <header className="flex min-w-0 items-center gap-3 pt-1">
      <Avatar size="xl">
        <AvatarImage src={user.avatar} alt="" />
        <AvatarFallback>{initialsOf(name) || "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{greeting}</p>
        <h1 className="truncate text-lg leading-tight font-semibold">
          {name || "bạn"}
          {planState.plan === "pro" ? (
            <BadgeCheckIcon
              className="ml-1 inline-block size-[18px] fill-ai align-[-0.15em] text-background"
              role="img"
              aria-label="Pro"
            />
          ) : null}
        </h1>
      </div>
      <NotificationsButton />
    </header>
  )
}
