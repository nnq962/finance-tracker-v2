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
          onChange={(event) => {
            if (signed) {
              const typedNegative = event.target.value.trimStart().startsWith("-")
              if (typedNegative !== negative) onNegativeChange?.(typedNegative)
            }
            const digits = event.target.value
              .replace(/\D/g, "")
              .replace(/^0+(?=\d)/, "")
              .slice(0, 15)

            emit(digits ? Number(digits) : null, true)
          }}
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
      {suggestions ? (
        <AmountSuggestions
          suggestions={getAmountSuggestions(typed, history ?? [])}
          value={value ? Number(value) : null}
          onSelect={(amount) => emit(amount, false)}
        />
      ) : null}
    </>
  )
}
