"use client"

import * as React from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type MonthFieldProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "id" | "className"
> & {
  id: string
  label?: string
}

export function MonthField({
  id,
  label = "Tháng",
  ...inputProps
}: MonthFieldProps) {
  return (
    <Field className="min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex min-w-0 w-full">
        <Input
          {...inputProps}
          id={id}
          type="month"
          className="w-auto min-w-0 max-w-full flex-1"
        />
      </div>
    </Field>
  )
}
