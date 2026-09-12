"use client"

import * as React from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getCurrentLocalDateTime } from "@/lib/date-time"

type DateTimeFieldsProps = {
  dateName?: string
  idPrefix: string
  label?: string
  required?: boolean
  timeName?: string
}

export function DateTimeFields({
  dateName = "date",
  idPrefix,
  label = "Thời điểm",
  required = false,
  timeName = "time",
}: DateTimeFieldsProps) {
  const [currentDateTime] = React.useState(getCurrentLocalDateTime)

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${idPrefix}-date`}
          aria-label="Ngày"
          name={dateName}
          type="date"
          defaultValue={currentDateTime.date}
          required={required}
        />
        <Input
          id={`${idPrefix}-time`}
          aria-label="Thời gian"
          name={timeName}
          type="time"
          defaultValue={currentDateTime.time}
          required={required}
        />
      </div>
    </Field>
  )
}
