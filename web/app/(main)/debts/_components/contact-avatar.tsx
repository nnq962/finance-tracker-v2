import { categoryColorOptions } from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

// Rose reads as money owed, slate as nothing chosen: neither marks a person.
const contactColors = categoryColorOptions.filter((color) => color.name !== "rose" && color.name !== "slate")

/** A colour of the category palette per person (FNV-1a of the id), the same on every visit. */
function contactColor(contactId: string) {
  let hash = 2_166_136_261
  for (const char of contactId) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0
  return contactColors[hash % contactColors.length].tileClassName
}

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
        contactColor(contactId),
      )}
    >
      {initials}
    </span>
  )
}
