"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import type { AccountActionResult } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"

import { balanceAdjustmentCategoryOptions } from "../../_data/account-form-options"

type AdjustBalanceFormProps = {
  action: (formData: FormData) => Promise<AccountActionResult>
  currentBalance: number
  onSuccess: () => void
}

export function AdjustBalanceForm({
  action,
  currentBalance,
  onSuccess,
}: AdjustBalanceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
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
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        startTransition(async () => {
          try {
            const result = await action(formData)

            if (result.success) {
              toast.success("Đã điều chỉnh số dư.")
              onSuccess()
              router.refresh()
              return
            }

            setErrorMessage(result.error)
            toast.error(result.error)
          } catch {
            const message = "Không thể điều chỉnh số dư. Vui lòng thử lại."
            setErrorMessage(message)
            toast.error(message)
          }
        })
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
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon />}
          {isPending ? "Đang lưu..." : "Lưu điều chỉnh"}
        </Button>
      </SheetFooter>
    </form>
  )
}
