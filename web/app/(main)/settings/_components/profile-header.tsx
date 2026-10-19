import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

/**
 * The person at the top of Settings, as iOS's Apple Account screen shows
 * them (option G of the profile mockup, 2026-10-19; a card with a 48 avatar,
 * the name over a truncated email and the plan's label before): no card, the
 * 96 avatar centred on the page (112 at first, the user wanted it smaller
 * and nearer the top), the name 28 bold, the email 15 grey
 * wrapping wherever it must, the plan's label under it. No Pro tick by the
 * name (the user found it Facebook-like); the plan opens from Lượt AI below.
 */
export function ProfileHeader({
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
  // On phones it sits 8 under the back button (the bar's own padding; the
  // page's 24 step is taken back), not a full step away: 24 read as too far
  // from the top, 2026-10-19.
  return (
    <section aria-label="Tài khoản" className="flex flex-col items-center px-4 text-center max-md:-mt-6">
      <Avatar size="2xl">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <p className="mt-3.5 max-w-full text-[28px] leading-9 font-bold tracking-tight">{name}</p>
      {email ? <p className="mt-0.5 max-w-full text-[15px] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{email}</p> : null}
      <Badge variant={isPro ? "ai" : "soft"} className="mt-3">
        {planLabel}
      </Badge>
    </section>
  )
}
