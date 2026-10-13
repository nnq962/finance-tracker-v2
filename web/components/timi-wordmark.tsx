import { cn } from "@/lib/utils"

/**
 * The name as the logo sets it (2026-10-13): "Timi" in the app's own
 * Manrope, extra bold and drawn in tight, beside the icon at about three
 * quarters of its height. It takes the text colour, so it reads in both
 * themes. Size it with a text size where it is used.
 */
export function TimiWordmark({ className }: { className?: string }) {
  return <span className={cn("leading-none font-extrabold tracking-[-0.03em] whitespace-nowrap", className)}>Timi</span>
}
