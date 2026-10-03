"use client"

import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
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
}

function formatInputValue(value: string) {
  if (!value) return ""

  return formatCurrency(Number(value), { signDisplay: "never" }).slice(0, -1)
}

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
}: CurrencyInputProps) {
  const [internalValue, setValue] = React.useState(
    defaultValue === undefined ? "" : String(defaultValue),
  )

  const value = controlledValue === undefined ? internalValue : controlledValue === null ? "" : String(controlledValue)
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

            setValue(digits.slice(0, 15))
            onValueChange?.(digits ? Number(digits.slice(0, 15)) : null)
          }}
          placeholder={placeholder}
          required={required}
          aria-invalid={invalid || undefined}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>đ</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <input type="hidden" name={name} value={value && minus + value} />
    </>
  )
}
