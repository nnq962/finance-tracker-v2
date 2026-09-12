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
  id: string
  name: string
  placeholder?: string
  required?: boolean
}

function formatInputValue(value: string) {
  if (!value) return ""

  return formatCurrency(Number(value), { signDisplay: "never" }).slice(0, -1)
}

export function CurrencyInput({
  id,
  name,
  placeholder = "0",
  required = false,
}: CurrencyInputProps) {
  const [value, setValue] = React.useState("")

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
