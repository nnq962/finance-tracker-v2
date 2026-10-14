import type { Account } from "@/lib/accounts/types"
import { getCategoryColor } from "@/lib/categories/category-colors"
import { getJarIcon } from "@/lib/savings/jar-icons"
import { savedShare } from "@/lib/savings/plan"
import { cn } from "@/lib/utils"

/**
 * A jar's icon inside a ring of how much is saved, in the jar's colour, green
 * once it is full. `row`: a list row's media, 36 across as an account's logo,
 * so names line up with the accounts below; `lead`: the head of its sheet.
 * A finished jar shows full.
 */
export function JarRing({ jar, size = "row" }: { jar: Pick<Account, "balance" | "goal">; size?: "row" | "lead" }) {
  // A finished jar was spent: full, as it was when bought.
  const share = jar.goal?.completedAt ? 1 : savedShare(jar)
  const full = share >= 1
  const icon = getJarIcon(jar.goal?.icon)
  const length = 2 * Math.PI * 16
  return (
    <span
      aria-hidden="true"
      className={cn("relative inline-flex shrink-0 items-center justify-center", size === "row" ? "size-9" : "size-24")}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth={size === "row" ? 2.6 : 2.2} className="stroke-muted" />
        {share > 0 ? (
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            strokeWidth={size === "row" ? 2.6 : 2.2}
            strokeLinecap="round"
            // The jar's own colour while filling (the category palette's, as its tile), green once full.
            stroke={full ? "var(--income)" : getCategoryColor(icon.tone).chartFill}
            strokeDasharray={`${share * length} ${length}`}
          />
        ) : null}
      </svg>
      <icon.icon className={cn(size === "row" ? "size-[18px]" : "size-10", full ? "text-income" : "text-foreground")} />
    </span>
  )
}
