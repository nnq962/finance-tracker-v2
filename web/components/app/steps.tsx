import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const tones = {
  default: "bg-primary",
  income: "bg-income",
  warning: "bg-warning",
  expense: "bg-expense",
} as const

/**
 * Progress in equal segments: the steps of a flow ("bước 2/4") or a strength
 * meter. Filled segments take the tone's colour.
 */
export function SegmentedProgress({
  count,
  value,
  tone = "default",
  label,
  className,
}: {
  count: number
  /** How many segments are filled. */
  value: number
  tone?: keyof typeof tones
  label: string
  className?: string
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuenow={value}
      className={cn("flex gap-1.5", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
          <span
            className={cn(
              "block h-full rounded-full transition-[width,background-color] duration-500 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:duration-150 motion-reduce:ease-out",
              tones[tone],
            )}
            style={{ width: index < value ? "100%" : "0%" }}
          />
        </span>
      ))}
    </div>
  )
}

/** Named steps of a flow joined by a line: done ones ticked, the current one ringed. */
export function Steps({ steps, current, className }: { steps: readonly string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className="flex flex-1 items-center last:flex-none"
        >
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-full text-sm font-medium tabular-nums",
                index < current && "bg-primary text-primary-foreground",
                index === current && "ring-2 ring-primary ring-inset",
                index > current && "bg-muted text-muted-foreground",
              )}
            >
              {index < current ? <CheckIcon strokeWidth={2.5} className="size-4" /> : index + 1}
            </span>
            <span className={cn("text-[11px]", index > current && "text-muted-foreground")}>{step}</span>
          </div>
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn("mx-2 mb-5 h-0.5 flex-1 rounded-full", index < current ? "bg-primary" : "bg-muted")}
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}
