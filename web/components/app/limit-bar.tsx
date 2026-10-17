import { cn } from "@/lib/utils"

/** ok: in the ink; near: amber (from the early warning, 80% or 90%, or spending ahead of plan); over: red, past the limit. */
export type LimitTone = "ok" | "near" | "over"

const fillClassName: Record<LimitTone, string> = {
  ok: "bg-primary",
  near: "bg-warning",
  over: "bg-expense",
}

/**
 * Spent against a limit as a plain bar, as iOS Screen Time draws a limit
 * (chosen 2026-10-16 over marks for "today"): the fill in the ink, amber or
 * red by `tone`, full once past the limit, on the grey rail; no marks.
 * `size`: `sm` 6 high (rows), `md` 10 (a lead figure).
 */
export function LimitBar({
  value,
  max,
  tone = "ok",
  size = "sm",
  label,
  className,
}: {
  value: number
  max: number
  tone?: LimitTone
  size?: "sm" | "md"
  /** What the bar measures, for screen readers. */
  label?: string
  className?: string
}) {
  const share = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={max > 0 ? Math.round((value / max) * 100) : 0}
      className={cn("relative block w-full overflow-hidden rounded-full bg-muted", size === "md" ? "h-2.5" : "h-1.5", className)}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-[translate,background-color] duration-500 ease-out motion-reduce:duration-150",
          fillClassName[tone],
        )}
        style={{ translate: `${(share - 1) * 100}% 0` }}
      />
    </span>
  )
}
