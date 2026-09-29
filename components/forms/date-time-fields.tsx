"use client"

import * as React from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getCurrentLocalDateTime } from "@/lib/date-time"

type DateTimeFieldsProps = {
  defaultDate?: string
  defaultTime?: string
  dateValue?: string
  dateName?: string
  idPrefix: string
  label?: string
  maxDate?: string
  minDate?: string
  onDateChange?: React.ChangeEventHandler<HTMLInputElement>
  required?: boolean
  timeName?: string
}

export function DateTimeFields({
  defaultDate,
  defaultTime,
  dateValue,
  dateName = "date",
  idPrefix,
  label = "Thời gian",
  maxDate,
  minDate,
  onDateChange,
  required = false,
  timeName = "time",
}: DateTimeFieldsProps) {
  const [currentDateTime] = React.useState(getCurrentLocalDateTime)

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid min-w-0 w-full gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0">
          <Input
            id={`${idPrefix}-date`}
            aria-label="Ngày"
            name={dateName}
            type="date"
            defaultValue={
              dateValue === undefined
                ? (defaultDate ?? currentDateTime.date)
                : undefined
            }
            value={dateValue}
            min={minDate}
            max={maxDate}
            onChange={onDateChange}
            required={required}
            className="w-auto min-w-0 max-w-full flex-1"
          />
        </div>
        <div className="flex min-w-0">
          <Input
            id={`${idPrefix}-time`}
            aria-label="Thời gian"
            name={timeName}
            type="time"
            defaultValue={defaultTime ?? currentDateTime.time}
            required={required}
            className="w-auto min-w-0 max-w-full flex-1"
          />
        </div>
      </div>
    </Field>
  )
}
