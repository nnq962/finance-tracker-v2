import { UserIcon } from "lucide-react"

import { personTileClassName } from "@/lib/person-color"
import { cn } from "@/lib/utils"

/**
 * A person's initials on a round tile the size of the rows' icons, in their
 * own toned-down colour, so a person looks the same in every list: loans,
 * the people, debts coming due on the overview. `lg` (48) heads a person's
 * screen and the form. Without a contact yet (a form's preview) it is grey,
 * a person's silhouette until there are initials.
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
    <span
      aria-hidden="true"
      className={cn(
        "tile-tinted flex shrink-0 items-center justify-center rounded-full font-medium",
        size === "lg" ? "size-12 text-base" : "size-9 text-xs",
        contactId ? personTileClassName(contactId) : "bg-muted text-muted-foreground",
      )}
    >
      {initials || <UserIcon className={size === "lg" ? "size-6" : "size-[18px]"} />}
    </span>
  )
}
