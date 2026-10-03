import Link from "next/link"
import { BadgeCheckIcon, SparklesIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { SessionUser } from "@/lib/auth/session"
import { formatTime } from "@/lib/format-date"
import { plans, type PlanName } from "@/lib/plans/plans"

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
 * name, the blue tick on Pro. On Free, a card below invites them to Pro, so
 * the name keeps the whole row.
 */
export function OverviewGreeting({ user, plan }: { user: SessionUser; plan: PlanName }) {
  const name = user.name.trim()

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 pt-1">
        <Avatar size="lg">
          <AvatarImage src={user.avatar} alt="" />
          <AvatarFallback>{initialsOf(name) || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{greetingFor(new Date())},</p>
          <h1 className="text-2xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]">
            {name || "bạn"}
            {plan === "pro" ? (
              <BadgeCheckIcon
                className="ml-1.5 inline-block size-5 fill-blue-500 align-[-0.15em] text-white"
                role="img"
                aria-label="Pro"
              />
            ) : null}
          </h1>
        </div>
      </header>

      {plan === "free" ? (
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e9ff] text-[#7a4aba] dark:bg-[#3b2c54] dark:text-[#d0b2ff]">
              <SparklesIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base leading-snug font-extrabold">Mở khoá {plans.pro.label}</p>
              <p className="text-sm text-muted-foreground">
                {plans.pro.aiMonthlyLimit} lượt AI/tháng, dùng sớm AI mới
              </p>
            </div>
            <Button asChild variant="grape" className="shrink-0">
              <Link href="/settings?screen=plan">Nâng cấp</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
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
        <Skeleton className="h-7 w-20" />
      </div>
    </div>
  )
}
