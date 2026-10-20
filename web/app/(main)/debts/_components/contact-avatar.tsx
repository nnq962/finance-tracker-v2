import { UserIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

/**
 * A person's initials on a round tile the size of the rows' icons, in their
 * own toned-down colour, so a person looks the same in every list: loans,
 * the people, debts coming due on the overview. `lg` (48) heads a person's
 * screen and the form. Without a contact yet (a form's preview) it is grey,
 * a person's silhouette until there are initials. Built on Avatar (md 36,
 * xl 48) since 2026-10-21, so a contact and a user share one shape.
 */
export function ContactAvatar({
  contactId,
  initials,
  size = "sm",
}: {
  contactId?: string
  initials: string
  size?: "sm" | "lg"
}) {
  return (
    <Avatar size={size === "lg" ? "xl" : "md"} aria-hidden="true">
      <AvatarFallback colorKey={contactId}>
        {initials || <UserIcon className={size === "lg" ? "size-6" : "size-[18px]"} />}
      </AvatarFallback>
    </Avatar>
  )
}
