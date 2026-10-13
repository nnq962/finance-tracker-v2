import { cn } from "@/lib/utils"

/**
 * "timi" as the logo writes it (docs/brand/timi-wordmark.svg): rounded
 * strokes, the last i's dot the lime sparkle. The letters take the text
 * colour, so it reads in both themes; beside the icon it stands as tall as
 * the tile, as in the lockup. The sparkle is the deeper lime on light
 * backgrounds, where the bright one fades into the cream. Decorative: the
 * link or label around it names the app.
 */
export function TimiWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 181 100" fill="none" aria-hidden="true" className={cn("w-auto shrink-0", className)}>
      <g stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 18V70Q22 90 40 90" />
        <path d="M8 42H38" />
        <path d="M62 48V90" />
        <path d="M86 90V60Q86 46 100 46Q114 46 114 60V90M114 60Q114 46 128 46Q142 46 142 60V90" />
        <path d="M166 48V90" />
      </g>
      <circle cx="62" cy="22" r="8" fill="currentColor" />
      <path
        d="M166 6C169.92 16.08 169.92 16.08 180 20C169.92 23.92 169.92 23.92 166 34C162.08 23.92 162.08 23.92 152 20C162.08 16.08 162.08 16.08 166 6Z"
        className="fill-ai-strong dark:fill-ai"
      />
    </svg>
  )
}
