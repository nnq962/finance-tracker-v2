import type { Account } from "@/lib/accounts/types"
import { getCategoryColor } from "@/lib/categories/category-colors"
import { getJarIcon } from "@/lib/savings/jar-icons"
import { savedShare } from "@/lib/savings/plan"
import { cn } from "@/lib/utils"

/**
 * A jar's icon inside a ring of how much is saved, in the jar's colour, green
 * once it is full. `row`: a list row's media, 36 across as an account's logo,
 * so names line up with the accounts below; `lead`: the head of its sheet;
 * `tile`: a jar's card on the accounts page (2026-10-23, the handoff): 50
 * across, a thick lime ring on the grey track and the icon in ink, every jar
 * alike. A finished jar shows full.
 */
export function JarRing({ jar, size = "row" }: { jar: Pick<Account, "balance" | "goal">; size?: "row" | "lead" | "tile" }) {
  // A finished jar was spent: full, as it was when bought.
  const share = jar.goal?.completedAt ? 1 : savedShare(jar)
  const full = share >= 1
  const icon = getJarIcon(jar.goal)
  const length = 2 * Math.PI * 16
  const tile = size === "tile"
  const stroke = tile ? 3.6 : size === "row" ? 2.6 : 2.2
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        size === "row" ? "size-9" : tile ? "size-[50px]" : "size-24",
      )}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
        <circle cx="18" cy="18" r={tile ? 16.2 : 16} fill="none" strokeWidth={stroke} className={tile ? "stroke-fill-3" : "stroke-muted"} />
        {share > 0 ? (
          <circle
            cx="18"
            cy="18"
            r={tile ? 16.2 : 16}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap={tile ? "butt" : "round"}
            // The jar's own colour while filling (the category palette's, as its tile), green once full; the lime on a tile.
            stroke={tile ? "var(--ai)" : full ? "var(--income)" : getCategoryColor(icon.tone).chartFill}
            strokeDasharray={`${share * (tile ? 2 * Math.PI * 16.2 : length)} ${tile ? 2 * Math.PI * 16.2 : length}`}
          />
        ) : null}
      </svg>
      {tile ? (
        <icon.icon className="size-[19px]" />
      ) : (
        // In the jar's colour, as the user chose it (2026-10-16), green once full.
        <icon.icon
          className={cn(size === "row" ? "size-[18px]" : "size-10", full && "text-income")}
          style={full ? undefined : { color: getCategoryColor(icon.tone).chartFill }}
        />
      )}
    </span>
  )
}
