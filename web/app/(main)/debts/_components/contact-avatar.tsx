import { personTileClassName } from "@/lib/person-color"
import { cn } from "@/lib/utils"

/**
 * A person's initials on a round tile the size of the rows' icons, in their
 * own toned-down colour, so a person looks the same in every list: loans,
 * the people, debts coming due on the overview.
 */
export function ContactAvatar({ contactId, initials }: { contactId: string; initials: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "tile-tinted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium",
        personTileClassName(contactId),
      )}
    >
      {initials}
    </span>
  )
}
