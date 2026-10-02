import { cn } from "@/lib/utils"

const splitTones = {
  leaf: "bg-[oklch(0.76_0.19_138)]",
  coral: "bg-[oklch(0.70_0.19_25)]",
} as const

type SplitProgressSegment = {
  value: number
  tone: keyof typeof splitTones
}

type SplitProgressProps = {
  segments: SplitProgressSegment[]
  "aria-label": string
  className?: string
}

/**
 * Two or more chunky pills sized by share. `Progress` only fills a single
 * track, so this reuses its face height, rounding and highlight for splits.
 */
export function SplitProgress({
  segments,
  className,
  "aria-label": ariaLabel,
}: SplitProgressProps) {
  const visibleSegments = segments.filter((segment) => segment.value > 0)

  return (
    <div role="img" aria-label={ariaLabel} className={cn("flex gap-1", className)}>
      {visibleSegments.length === 0 ? (
        <span className="h-[18px] flex-1 rounded-full bg-[#e7e4dd] dark:bg-[#494750]" />
      ) : (
        visibleSegments.map((segment, index) => (
          <span
            key={index}
            className={cn(
              "relative h-[18px] min-w-[18px] overflow-hidden rounded-full",
              splitTones[segment.tone],
            )}
            style={{ flexGrow: segment.value, flexBasis: 0 }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-2.5 top-1 h-1 rounded-full bg-white/35"
            />
          </span>
        ))
      )}
    </div>
  )
}
