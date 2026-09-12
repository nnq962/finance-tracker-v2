"use client"

import * as React from "react"
import { SaveIcon } from "lucide-react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/format-currency"

import { balanceAdjustmentCategoryOptions } from "../../_data/account-form-options"

type AdjustBalanceFormProps = {
  currentBalance: number
  onSubmit: () => void
}

export function AdjustBalanceForm({
  currentBalance,
  onSubmit,
}: AdjustBalanceFormProps) {
  const [actualBalance, setActualBalance] = React.useState<number | null>(null)
  const difference =
    actualBalance === null ? null : actualBalance - currentBalance
  const differenceClassName =
    difference === null || difference === 0
      ? "text-muted-foreground"
      : difference > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400"

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="actual-balance">Số dư thực tế</FieldLabel>
            <CurrencyInput
              id="actual-balance"
              name="actualBalance"
              onValueChange={setActualBalance}
              required
            />
          </Field>

          <Card size="sm">
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
                <p className="font-medium tabular-nums">
                  {formatCurrency(currentBalance)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Chênh lệch</p>
                <p className={`font-medium tabular-nums ${differenceClassName}`}>
                  {difference === null
                    ? "—"
                    : formatCurrency(difference, { signDisplay: "always" })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Field>
            <FieldLabel htmlFor="balance-adjustment-category">
              Hạng mục
            </FieldLabel>
            <Select name="category" required>
              <SelectTrigger
                id="balance-adjustment-category"
                className="w-full"
              >
                <SelectValue placeholder="Chọn hạng mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {balanceAdjustmentCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <DateTimeFields
            idPrefix="balance-adjustment"
            label="Thời gian"
            required
          />

          <Field>
            <FieldLabel htmlFor="balance-adjustment-note">Ghi chú</FieldLabel>
            <Textarea
              id="balance-adjustment-note"
              name="note"
              placeholder="Lý do điều chỉnh số dư..."
            />
          </Field>
        </FieldGroup>
      </div>

      <SheetFooter>
        <Button type="submit">
          <SaveIcon />
          Lưu điều chỉnh
        </Button>
      </SheetFooter>
    </form>
  )
}
