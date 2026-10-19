import { BadgeCheckIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/**
 * The person at the top of Settings, as the page's lead card: the plain
 * card (2026-10-19 evening, option E of the lead-card mockup; the black /
 * white card, without glow or avatar ring, for the day before), the avatar
 * on the accent lime, the name and email, the plan's label at the end. Not a button: the plan opens
 * from Lượt AI below.
 */
export function ProfileCard({
  name,
  email,
  avatar,
  initials,
  isPro,
  planLabel,
}: {
  name: string
  email?: string
  avatar?: string
  initials: string
  isPro: boolean
  planLabel: string
}) {
  return (
    <Card size="lg">
      <CardContent className="flex items-center gap-4">
        <Avatar size="xl">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback accent>{initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1 text-base font-semibold">
            <span className="truncate">{name}</span>
            {isPro ? <BadgeCheckIcon className="size-4 shrink-0 text-ai-strong" role="img" aria-label="Pro" /> : null}
          </span>
          {email ? (
            <CardLabel as="span" className="truncate">
              {email}
            </CardLabel>
          ) : null}
        </span>
        <Badge variant={isPro ? "ai" : "soft"}>{planLabel}</Badge>
      </CardContent>
    </Card>
  )
}
