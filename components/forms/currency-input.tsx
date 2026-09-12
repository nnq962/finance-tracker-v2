"use client"

import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { formatCurrency } from "@/lib/format-currency"

type CurrencyInputProps = {
  defaultValue?: number
  id: string
  name: string
  onValueChange?: (value: number | null) => void
  placeholder?: string
  required?: boolean
}

function formatInputValue(value: string) {
  if (!value) return ""

  return formatCurrency(Number(value), { signDisplay: "never" }).slice(0, -1)
}

export function CurrencyInput({
  defaultValue,
  id,
  name,
  onValueChange,
  placeholder = "0",
  required = false,
}: CurrencyInputProps) {
  const [value, setValue] = React.useState(
    defaultValue === undefined ? "" : String(defaultValue),
  )

  return (
    <>
      <InputGroup>
        <InputGroupInput
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={formatInputValue(value)}
          onChange={(event) => {
            const digits = event.target.value
              .replace(/\D/g, "")
              .replace(/^0+(?=\d)/, "")

            setValue(digits.slice(0, 15))
            onValueChange?.(digits ? Number(digits.slice(0, 15)) : null)
          }}
          placeholder={placeholder}
          required={required}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>đ</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <input type="hidden" name={name} value={value} />
    </>
  )
}
