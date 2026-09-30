"use client"

import * as React from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getCurrentLocalDateTime } from "@/lib/date-time"
import { cn } from "@/lib/utils"

type DateTimeFieldsProps = {
  defaultDate?: string
  defaultTime?: string
  dateValue?: string
  dateName?: string
  description?: string
  disabled?: boolean
  idPrefix: string
  label?: string
  maxDate?: string
  minDate?: string
  onDateChange?: React.ChangeEventHandler<HTMLInputElement>
  onTimeChange?: React.ChangeEventHandler<HTMLInputElement>
  required?: boolean
  showDate?: boolean
  timeName?: string
  timeValue?: string
}

export function DateTimeFields({
  defaultDate,
  defaultTime,
  dateValue,
  dateName = "date",
  description,
  disabled = false,
  idPrefix,
  label = "Thời gian",
  maxDate,
  minDate,
  onDateChange,
  onTimeChange,
  required = false,
  showDate = true,
  timeName = "time",
  timeValue,
}: DateTimeFieldsProps) {
  const [currentDateTime] = React.useState(getCurrentLocalDateTime)

  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel htmlFor={showDate ? undefined : `${idPrefix}-time`}>
        {label}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <div
        className={cn(
          "grid min-w-0 w-full gap-4",
          showDate && "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
        )}
      >
        {showDate ? (
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
              disabled={disabled}
              className="w-auto min-w-0 max-w-full flex-1"
            />
          </div>
        ) : null}
        <div className="flex min-w-0">
          <Input
            id={`${idPrefix}-time`}
            aria-label="Thời gian"
            name={timeName}
            type="time"
            defaultValue={
              timeValue === undefined
                ? (defaultTime ?? currentDateTime.time)
                : undefined
            }
            value={timeValue}
            onChange={onTimeChange}
            required={required}
            disabled={disabled}
            className="w-auto min-w-0 max-w-full flex-1"
          />
        </div>
      </div>
    </Field>
  )
}
