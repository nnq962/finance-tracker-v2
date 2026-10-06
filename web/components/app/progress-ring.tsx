import { cn } from "@/lib/utils"

const sizeClassName = {
  sm: "size-16",
  md: "size-28",
} as const

/**
 * Progress as a thin ring around its count, e.g. missions done: a light
 * track and a dark arc from twelve o'clock, the value and a label inside.
 */
export function ProgressRing({
  value,
  max,
  label,
  size = "md",
  className,
}: {
  value: number
  max: number
  /** Below the count, e.g. "đã xong"; also read out with it. */
  label?: string
  size?: keyof typeof sizeClassName
  className?: string
}) {
  // The circle's length for r=16, so the dash is the share done.
  const length = 2 * Math.PI * 16
  const share = max > 0 ? Math.min(value / max, 1) : 0

  return (
    <div
      data-slot="progress-ring"
      role="img"
      aria-label={`${value}/${max}${label ? ` ${label}` : ""}`}
      className={cn("relative shrink-0", sizeClassName[size], className)}
    >
      <svg viewBox="0 0 36 36" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="0.8" className="stroke-muted" />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={`${share * length} ${length}`}
          className="stroke-primary motion-safe:transition-[stroke-dasharray] motion-safe:duration-500"
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 grid place-content-center text-center">
        <p className={cn("font-medium tabular-nums", size === "md" ? "text-2xl" : "text-sm")}>
          {value}/{max}
        </p>
        {label && size === "md" ? <p className="text-[10px] text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  )
}
