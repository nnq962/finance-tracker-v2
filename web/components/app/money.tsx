import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { formatCompactCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

const numberFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 })

const moneyVariants = cva("inline-flex min-w-0 font-semibold tabular-nums [overflow-wrap:anywhere]", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-xl tracking-tight",
      xl: "text-[34px] leading-tight tracking-tight",
    },
    tone: {
      default: "",
      income: "text-income",
      expense: "text-expense",
      transfer: "text-transfer",
      // Figures that no longer count, e.g. an archived account's balance.
      muted: "text-muted-foreground",
    },
    // A fitted figure keeps its size's line height, centred in it, whatever
    // size it is set at, so figures side by side keep what is under them level.
    // It stays on one line only where it can shrink to fit; elsewhere it wraps.
    fit: {
      false: "items-baseline",
      true: "min-h-lh items-center supports-[font-size:round(down,1cqi,1px)]:whitespace-nowrap",
    },
  },
  defaultVariants: { size: "md", tone: "default", fit: false },
})

type MoneyProps = {
  amount: number
  /** auto: a minus sign below zero; always: + above zero too; never: no sign. */
  sign?: "auto" | "always" | "never"
  className?: string
} & VariantProps<typeof moneyVariants>

/**
 * The unit on the large sizes (the đ, or tr/tỷ in a short figure): 14px beside
 * 20px digits, 20px beside 34px. In em, so it follows a fitted figure.
 */
const unitScale = { lg: 14 / 20, xl: 20 / 34 } as const

/**
 * How wide each character of a figure is, in em, in Be Vietnam Pro SemiBold
 * (measured in Chrome). Its digits are proportional (the font has no tabular
 * figures), so a fitted figure is sized from these rather than from a count of
 * digits. Anything not listed counts as the widest digit.
 */
const glyphWidths: Record<string, number> = {
  "0": 0.692,
  "1": 0.415,
  "2": 0.66,
  "3": 0.674,
  "4": 0.716,
  "5": 0.674,
  "6": 0.693,
  "7": 0.596,
  "8": 0.656,
  "9": 0.693,
  ".": 0.319,
  ",": 0.332,
  "+": 0.637,
  "−": 0.653,
  đ: 0.677,
  k: 0.584,
  r: 0.416,
  t: 0.434,
  ỷ: 0.592,
}

const widthOf = (text: string) => Array.from(text).reduce((sum, char) => sum + (glyphWidths[char] ?? 0.716), 0)

/**
 * The tracking of the large sizes (tracking-tight, -0.025em). It is resolved
 * on the outer span, so every character of a figure, the smaller unit
 * included and whatever size a fitted figure is set at, takes that much (in
 * em of the size) off its width.
 */
const tightTracking = 0.025

/** The smallest a fitted figure gets, as a share of its size: 15px for lg. */
const fitMin = 0.75

/** Headroom on the estimated width, for rounding and a fallback font's wider digits. */
const fitRoom = 1.01

/**
 * An amount of money as a figure rather than text: tabular digits and the
 * sign in the amount's colour, with the đ written right after the digits, as
 * Vietnamese amounts are usually written. On the large sizes (lg, xl) the đ
 * is smaller and at half strength, as in the mockup, so the digits lead.
 *
 * `fit` is for figures in narrow tiles (FlowTiles): the figure stays on one
 * line and is sized to the nearest `@container`, at its size while it fits
 * and smaller down to three quarters of it. Where even that is too wide it
 * shows the short form (+1,25tỷ), with the full amount for screen readers and
 * as the tooltip. Without a container around it, it is sized to the screen.
 * Browsers without round() or container units show the full form, wrapping.
 */
export function Money({ amount, sign = "auto", size, tone, fit, className }: MoneyProps) {
  const prefix = sign === "never" ? "" : amount < 0 ? "−" : amount > 0 && sign === "always" ? "+" : ""
  const digits = numberFormatter.format(Math.abs(amount))
  const scale = size === "lg" || size === "xl" ? unitScale[size] : undefined
  const unit = (text: string) =>
    scale ? (
      <span className="opacity-50" style={{ fontSize: `${scale}em` }}>
        {text}
      </span>
    ) : (
      text
    )

  if (!fit) {
    return (
      <span data-slot="money" className={cn(moneyVariants({ size, tone }), className)}>
        {prefix}
        {digits}
        {unit("đ")}
      </span>
    )
  }

  const full = `${prefix}${digits}đ`
  const short = formatCompactCurrency(Math.abs(amount), 1)
  const shortDigits = short.replace(/[^\d.,].*$/, "")
  const shortUnit = short.slice(shortDigits.length)
  // A form set at font size f is f × width − spacing wide: the width scales
  // with f, the spacing (see tightTracking) stays in em of the size.
  const formOf = (figure: string, unitText: string) => ({
    width: (widthOf(`${prefix}${figure}`) + widthOf(unitText) * (scale ?? 1)) * fitRoom,
    spacing: Array.from(`${prefix}${figure}${unitText}`).length * (scale ? tightTracking : 0),
  })
  const fullForm = formOf(digits, "đ")
  // In these font sizes 1em is the size's own (the outer span's), so a form
  // is set at the size while it fits and shrinks with the container below
  // that, down to fitMin.
  const fitted = ({ width, spacing }: { width: number; spacing: number }) =>
    `clamp(${fitMin}em, (100cqi + ${spacing.toFixed(3)}em) / ${width.toFixed(3)}, 1em)`
  // 1em where the full form fits at fitMin, else 0, and nothing in between:
  // round() snaps the clamped ramp to one end, so at every container width
  // exactly one of the two forms has a font size and the other is hidden.
  const fullFitsFrom = `${(fitMin * fullForm.width - fullForm.spacing).toFixed(3)}em`
  const fullShows = `round(down, clamp(0px, 100cqi - ${fullFitsFrom} + 1em, 1em), 1em)`

  // Browsers without round() or container units (iOS 15, older Chromium)
  // would drop these sizes and show both forms: there only the full form
  // shows, at its size, and wraps when it must, as an unfitted figure does.
  return (
    <span
      data-slot="money"
      title={full}
      className={cn(moneyVariants({ size, tone, fit }), className)}
      style={
        {
          "--money-full": fitted(fullForm),
          "--money-short": fitted(formOf(shortDigits, shortUnit)),
          "--money-full-shows": fullShows,
        } as React.CSSProperties
      }
    >
      <span className="sr-only">{full}</span>
      <span
        aria-hidden="true"
        className="supports-[font-size:round(down,1cqi,1px)]:[font-size:min(var(--money-full),var(--money-full-shows))]"
      >
        {prefix}
        {digits}
        {unit("đ")}
      </span>
      <span
        aria-hidden="true"
        className="hidden supports-[font-size:round(down,1cqi,1px)]:inline supports-[font-size:round(down,1cqi,1px)]:[font-size:min(var(--money-short),1em_-_var(--money-full-shows))]"
      >
        {prefix}
        {shortDigits}
        {unit(shortUnit)}
      </span>
    </span>
  )
}
