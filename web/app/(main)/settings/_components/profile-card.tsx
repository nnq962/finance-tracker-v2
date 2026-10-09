import { BadgeCheckIcon } from "lucide-react"

import { CardLabel } from "@/components/app/card-label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/**
 * The person at the top of Settings, as the page's lead card: on the dark,
 * a soft lime glow behind a lime-ringed avatar, the name and email, the
 * plan's label at the end. Not a button: the plan opens from Lượt AI below.
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
    <Card size="lg" variant="inverse" discs={false}>
      <span aria-hidden="true" className="pointer-events-none absolute -top-20 -left-16 -z-10 size-56 rounded-full bg-ai/20 blur-3xl" />
      <CardContent className="flex items-center gap-4">
        <Avatar size="xl" className="ring-4 ring-ai/25">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback accent>{initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex min-w-0 items-center gap-1 text-base font-semibold">
            <span className="truncate">{name}</span>
            {isPro ? <BadgeCheckIcon className="size-4 shrink-0 text-ai" role="img" aria-label="Pro" /> : null}
          </span>
          {email ? (
            <CardLabel as="span" className="truncate">
              {email}
            </CardLabel>
          ) : null}
        </span>
        <Badge variant={isPro ? "ai" : "inverse"}>{planLabel}</Badge>
      </CardContent>
    </Card>
  )
}
