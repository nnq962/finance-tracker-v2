import Link from "next/link"
import { BadgeCheckIcon, SparklesIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { SessionUser } from "@/lib/auth/session"
import { formatTime } from "@/lib/format-date"
import type { PlanName } from "@/lib/plans/plans"

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
 * The overview's heading: the user's avatar and a greeting by first name
 * (the last word of a Vietnamese name), with the blue tick on Pro and, on
 * Free, a way to the plans.
 */
export function OverviewGreeting({ user, plan }: { user: SessionUser; plan: PlanName }) {
  const name = user.name.trim()
  const firstName = name.split(/\s+/).at(-1) || "bạn"

  return (
    <header className="flex items-center gap-3 pt-1">
      <Avatar size="lg">
        <AvatarImage src={user.avatar} alt="" />
        <AvatarFallback>{initialsOf(name) || "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{greetingFor(new Date())},</p>
        <h1 className="flex min-w-0 items-center gap-1.5 text-2xl font-semibold tracking-tight">
          <span className="truncate">{firstName}</span>
          {plan === "pro" ? (
            <BadgeCheckIcon className="size-5 shrink-0 fill-blue-500 text-white" role="img" aria-label="Pro" />
          ) : null}
        </h1>
      </div>
      {plan === "free" ? (
        <Button asChild>
          <Link href="/settings/plan">
            <SparklesIcon data-icon="inline-start" aria-hidden="true" />
            Nâng cấp Pro
          </Link>
        </Button>
      ) : null}
    </header>
  )
}

/** Same footprint as OverviewGreeting, for the loading state. */
export function OverviewGreetingSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 pt-1">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  )
}
