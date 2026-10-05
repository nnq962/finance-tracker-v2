import { BadgeCheckIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import type { SessionUser } from "@/lib/auth/session"
import { formatTime } from "@/lib/format-date"
import type { PaymentOutcome } from "@/lib/plans/payos"
import type { PlanState } from "@/lib/plans/plans"

import { PlanInvite } from "./plan-invite"

/** By the hour in Vietnam. */
function greetingFor(now: Date) {
  const hour = Number(formatTime(now).slice(0, 2))
  if (hour >= 4 && hour < 11) return "Chào buổi sáng"
  if (hour >= 11 && hour < 13) return "Chào buổi trưa"
  if (hour >= 13 && hour < 18) return "Chào buổi chiều"
  return "Chào buổi tối"
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}

/**
 * The overview's heading: the user's avatar and a greeting with their full
 * name, the blue tick on Pro. On Free, a small pill at the end of the row
 * invites them to Pro.
 */
export function OverviewGreeting({
  user,
  planState,
  checkoutEnabled,
  paymentOutcome,
  openPlan,
}: {
  user: SessionUser
  planState: PlanState
  checkoutEnabled: boolean
  paymentOutcome?: PaymentOutcome
  /** Back from payOS: the plans open again. */
  openPlan: boolean
}) {
  const name = user.name.trim()

  return (
    <div className="flex items-center justify-between gap-3">
      <header className="flex min-w-0 items-center gap-3 pt-1">
        <Avatar size="lg">
          <AvatarImage src={user.avatar} alt="" />
          <AvatarFallback>{initialsOf(name) || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted-foreground">{greetingFor(new Date())},</p>
          <h1 className="truncate text-xl leading-tight font-semibold tracking-tight md:text-2xl">
            {name || "bạn"}
            {planState.plan === "pro" ? (
              <BadgeCheckIcon
                className="ml-1.5 inline-block size-5 fill-blue-500 align-[-0.15em] text-white"
                role="img"
                aria-label="Pro"
              />
            ) : null}
          </h1>
        </div>
      </header>

      <PlanInvite
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={paymentOutcome}
        initialOpen={openPlan}
      />
    </div>
  )
}

/** Same footprint as OverviewGreeting, for the loading state. */
export function OverviewGreetingSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 pt-1">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  )
}
