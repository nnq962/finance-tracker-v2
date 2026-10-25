"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"

import { SoftSwap } from "@/components/app/soft-swap"
import { cn } from "@/lib/utils"

import { HIDE_BALANCE_COOKIE } from "../_lib/hide-balance-cookie"

/**
 * Ẩn số dư (2026-10-25): the overview's figures hidden behind dots, as banking
 * apps hide a balance, so the app can be opened among people. Remembered in a
 * cookie (HIDE_BALANCE_COOKIE), so the page comes from the server already
 * hidden and no figure shows for a moment first. This is what stands in
 * place of a hidden figure.
 */
export const HIDDEN_FIGURE = "••••••"

/** Whether the figures are hidden, and the switch, kept in the cookie for a year. */
export function useHiddenBalance(initial: boolean) {
  const [hidden, setHidden] = React.useState(initial)
  const toggle = React.useCallback(() => {
    setHidden((current) => {
      const next = !current
      document.cookie = `${HIDE_BALANCE_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`
      return next
    })
  }, [])
  return [hidden, toggle] as const
}

/** A figure or its dots, cross-blurring from one to the other (SoftSwap). */
export function Hideable({
  hidden,
  children,
  dots = HIDDEN_FIGURE,
  inline = true,
  className,
}: {
  hidden: boolean
  children: React.ReactNode
  dots?: React.ReactNode
  inline?: boolean
  className?: string
}) {
  return (
    <SoftSwap value={hidden ? "hidden" : "shown"} inline={inline}>
      {(state) => (state === "hidden" ? <span className={cn("tracking-[-0.12em]", className)}>{dots}</span> : children)}
    </SoftSwap>
  )
}

/**
 * The eye beside a hidden figure's label: open while figures show, struck
 * through while hidden. The two glyphs share the slot and cross-fade, the
 * leaving one shrinking to a quarter and blurring as the arriving one grows
 * (make-interfaces-feel-better: scale .25 → 1, blur 4px → 0, 200ms,
 * cubic-bezier(0.2, 0, 0, 1)); under reduced motion a plain fade.
 */
export function EyeToggle({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  const glyph = "absolute inset-0 m-auto size-4 transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-opacity"
  const away = "scale-25 opacity-0 blur-[4px] motion-reduce:scale-100 motion-reduce:blur-none"
  const here = "scale-100 opacity-100 blur-none"
  return (
    <button
      type="button"
      aria-label={hidden ? "Hiện số dư" : "Ẩn số dư"}
      aria-pressed={hidden}
      onClick={onToggle}
      className="relative size-6 shrink-0 rounded-full text-muted-foreground outline-none after:absolute after:-inset-2.5 focus-visible:ring-3 focus-visible:ring-ring/30 active:bg-fill-1"
    >
      <EyeIcon aria-hidden="true" className={cn(glyph, hidden ? away : here)} />
      <EyeOffIcon aria-hidden="true" className={cn(glyph, hidden ? here : away)} />
    </button>
  )
}
