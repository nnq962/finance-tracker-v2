"use client"

import * as React from "react"
import { CoinsIcon, XIcon } from "lucide-react"

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

/**
 * An amount in đồng, grouped as it is typed (1.250.000) on the number pad. A
 * coin at the start says it is money (not in a field under 13rem, where the
 * number needs the room), "đ" follows the number, and once there is a number
 * a ✕ clears it in one tap, keeping the keyboard up. With `onNegativeChange`
 * the start holds the +/− button instead of the coin.
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
}: CurrencyInputProps) {
  const [internalValue, setValue] = React.useState(
    defaultValue === undefined ? "" : String(defaultValue),
  )

  const value = controlledValue === undefined ? internalValue : controlledValue === null ? "" : String(controlledValue)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const signed = Boolean(onNegativeChange)
  const minus = signed && negative ? "-" : ""

  return (
    <>
      {/* A container, so the coin gives way to the number in a narrow field (two side by side). */}
      <InputGroup className="@container/amount">
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
        ) : (
          <InputGroupAddon align="inline-start" className="hidden @[13rem]/amount:flex">
            <CoinsIcon aria-hidden="true" />
          </InputGroupAddon>
        )}
        <InputGroupInput
          ref={inputRef}
          id={id}
          // Without the coin (narrow, unsigned), the number keeps the field's own inset.
          className={signed ? undefined : "@max-[13rem]/amount:pl-[var(--control-px,1rem)]!"}
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
          {value ? (
            <InputGroupButton
              size="icon-xs"
              aria-label="Xoá số tiền"
              onClick={() => {
                setValue("")
                onValueChange?.(null)
                inputRef.current?.focus()
              }}
            >
              <XIcon />
            </InputGroupButton>
          ) : null}
        </InputGroupAddon>
      </InputGroup>
      <input type="hidden" name={name} value={value && minus + value} />
    </>
  )
}
