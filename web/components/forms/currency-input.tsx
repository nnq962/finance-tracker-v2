"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { AmountSuggestions } from "@/components/forms/amount-suggestions"
import { getAmountSuggestions } from "@/lib/amount-suggestions"
import { formatCurrency } from "@/lib/format-currency"
import { cn } from "@/lib/utils"

type CurrencyInputProps = {
  value?: number | null
  defaultValue?: number
  id: string
  name: string
  onValueChange?: (value: number | null) => void
  placeholder?: string
  required?: boolean
  /** Marks the amount as wrong, e.g. left empty, for the field's error below it. */
  invalid?: boolean
  /**
   * With `onNegativeChange`, the amount can be below zero: a +/− button
   * flips its sign (phone keypads have no minus) and a typed "-" works too.
   * `value` stays the amount without its sign; the submitted field is signed.
   */
  negative?: boolean
  onNegativeChange?: (negative: boolean) => void
  /**
   * Quick picks under the field (default on): the digits typed scaled up,
   * 3 → 3.000, 30.000, 300.000…, as Vietnamese banking apps offer them.
   * False where the field needs none.
   */
  suggestions?: boolean
  /** Past amounts, newest first: the most frequent show before anything is typed, and lead the picks that match. */
  history?: number[]
  /**
   * field: a form's field. hero: the screen's one amount, as a money app
   * opens on it: a large number in the middle, its sign before it and a
   * faded "đ" after, on no field, the suggestions centred under it.
   */
  variant?: "field" | "hero"
  /** hero only: the sign shown before the number once there is one, e.g. − for spending. */
  sign?: "+" | "−"
  /** hero only: income in its colour, as Money shows it. */
  tone?: "default" | "income"
  /** hero only: the keyboard comes up with the field, as a money app opens on its amount. */
  autoFocus?: boolean
}

function formatInputValue(value: string) {
  if (!value) return ""

  return formatCurrency(Number(value), { signDisplay: "never" }).slice(0, -1)
}

/**
 * An amount in đồng, grouped as it is typed (1.250.000) on the number pad;
 * its label says it is money, so the field holds only the number. Once there
 * is one, a ✕ at the end clears it in one tap, keeping the keyboard up. With
 * `onNegativeChange` a +/− button at the start flips its sign.
 *
 * Under it, chips suggest amounts from the digits typed. They follow what was
 * typed, not what was picked, so picking one keeps the row still and marks
 * the choice; a value set from outside (a form reset, a sheet opened again)
 * clears what was typed, and the chips with it.
 */
export function CurrencyInput({
  value: controlledValue,
  defaultValue,
  id,
  name,
  onValueChange,
  placeholder = "0",
  required = false,
  invalid = false,
  negative = false,
  onNegativeChange,
  suggestions = true,
  history,
  variant = "field",
  sign,
  tone = "default",
  autoFocus = false,
}: CurrencyInputProps) {
  const [internalValue, setValue] = React.useState(
    defaultValue === undefined ? "" : String(defaultValue),
  )
  // The digits typed, and the value last sent up: a value from outside that is not it clears them.
  const [typed, setTyped] = React.useState<number | null>(null)
  const [sent, setSent] = React.useState(controlledValue)
  if (controlledValue !== undefined && controlledValue !== sent) {
    setSent(controlledValue)
    setTyped(null)
  }
  const emit = (next: number | null, byTyping: boolean) => {
    setValue(next === null ? "" : String(next))
    setSent(next)
    if (byTyping) setTyped(next)
    onValueChange?.(next)
  }

  const value = controlledValue === undefined ? internalValue : controlledValue === null ? "" : String(controlledValue)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const signed = Boolean(onNegativeChange)
  const minus = signed && negative ? "-" : ""

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (signed) {
      const typedNegative = event.target.value.trimStart().startsWith("-")
      if (typedNegative !== negative) onNegativeChange?.(typedNegative)
    }
    const digits = event.target.value
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "")
      .slice(0, 15)

    emit(digits ? Number(digits) : null, true)
  }
  const chips = suggestions ? (
    <AmountSuggestions
      suggestions={getAmountSuggestions(typed, history ?? [])}
      value={value ? Number(value) : null}
      onSelect={(amount) => emit(amount, false)}
      className={variant === "hero" ? "mx-auto w-fit max-w-full" : undefined}
    />
  ) : null

  if (variant === "hero") {
    const shown = formatInputValue(value)
    // The field as wide as what it holds, so the sign, the number and "đ" stay centred together.
    const digitCount = (shown || placeholder).replace(/\D/g, "").length || 1
    const separatorCount = shown.length - shown.replace(/\D/g, "").length

    return (
      <>
        <div
          className={cn(
            "flex max-w-full items-baseline justify-center text-[40px] leading-tight font-semibold tracking-tight tabular-nums",
            invalid ? "text-destructive" : tone === "income" && value ? "text-income" : undefined,
          )}
          // A tap anywhere on the amount brings the keyboard up.
          onClick={() => inputRef.current?.focus()}
        >
          {sign && value ? <span aria-hidden="true">{sign}</span> : null}
          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus={autoFocus}
            value={shown}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            aria-invalid={invalid || undefined}
            // As wide as what it holds; an estimate where the browser cannot size it to its content.
            style={{ "--amount-width": `calc(${digitCount}ch + ${separatorCount * 0.3}ch)` } as React.CSSProperties}
            className="w-(--amount-width) min-w-[1ch] bg-transparent text-center caret-foreground outline-none field-sizing-content placeholder:text-muted-foreground/40 supports-[field-sizing:content]:w-auto"
          />
          <span aria-hidden="true" className="text-[0.6em] opacity-50">
            đ
          </span>
        </div>
        <input type="hidden" name={name} value={value} />
        {chips}
      </>
    )
  }

  return (
    <>
      <InputGroup>
        {signed ? (
          <InputGroupAddon align="inline-start">
            <InputGroupButton
              aria-label="Đổi dấu âm, dương"
              aria-pressed={negative}
              onClick={() => onNegativeChange?.(!negative)}
            >
              +/−
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
        <InputGroupInput
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={minus + formatInputValue(value)}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-invalid={invalid || undefined}
        />
        {value ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Xoá số tiền"
              onClick={() => {
                emit(null, true)
                inputRef.current?.focus()
              }}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      <input type="hidden" name={name} value={value && minus + value} />
      {chips}
    </>
  )
}
