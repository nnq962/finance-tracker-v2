"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { AccountActionResult } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

type AdjustBalanceFormProps = {
  action: (formData: FormData) => Promise<AccountActionResult>
  currentBalance: number
  categoryGroups: CategoryGroup[]
  onSuccess: () => void
}

export function AdjustBalanceForm({
  action,
  currentBalance,
  categoryGroups,
  onSuccess,
}: AdjustBalanceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [actualBalance, setActualBalance] = React.useState<number | null>(null)
  const [categoryId, setCategoryId] = React.useState("")
  const difference =
    actualBalance === null ? null : actualBalance - currentBalance
  const adjustmentType =
    difference === null || difference === 0
      ? null
      : difference > 0
        ? "income"
        : "expense"
  const availableCategoryGroups = categoryGroups.filter(
    (group) => group.type === adjustmentType && group.items.length > 0,
  )
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
        <FieldGroup>
          <Card>
            <CardHeader>
              <CardTitle>Số dư thực tế</CardTitle>
              <CardDescription>
                Nhập số dư hiện tại để tính khoản chênh lệch.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">VND</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="actual-balance" className="sr-only">
                  Số dư thực tế
                </FieldLabel>
                <CurrencyInput
                  id="actual-balance"
                  name="actualBalance"
                  onValueChange={(value) => {
                    const nextDifference =
                      value === null ? null : value - currentBalance
                    const nextAdjustmentType =
                      nextDifference === null || nextDifference === 0
                        ? null
                        : nextDifference > 0
                          ? "income"
                          : "expense"

                    if (nextAdjustmentType !== adjustmentType) setCategoryId("")
                    setActualBalance(value)
                  }}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Số dư hiện tại
                  </p>
                  <p className="font-medium tabular-nums">
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Chênh lệch</p>
                  <p
                    className={`font-medium tabular-nums ${differenceClassName}`}
                  >
                    {difference === null
                      ? "—"
                      : formatCurrency(difference, { signDisplay: "always" })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin điều chỉnh</CardTitle>
              <CardDescription>
                Chọn hạng mục, thời gian và ghi lại lý do đối soát.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="balance-adjustment-category">
                    {adjustmentType === "income"
                      ? "Hạng mục thu"
                      : adjustmentType === "expense"
                        ? "Hạng mục chi"
                        : "Hạng mục"}
                  </FieldLabel>
                  <Select
                    name="categoryId"
                    value={categoryId}
                    onValueChange={setCategoryId}
                    disabled={!adjustmentType}
                    required
                  >
                    <SelectTrigger
                      id="balance-adjustment-category"
                      className="w-full"
                    >
                      <SelectValue
                        placeholder={
                          adjustmentType === "income"
                            ? "Chọn hạng mục thu"
                            : adjustmentType === "expense"
                              ? "Chọn hạng mục chi"
                              : "Nhập số dư thực tế trước"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategoryGroups.map((group) => (
                        <SelectGroup key={group.id}>
                          <SelectLabel>{group.name}</SelectLabel>
                          {group.items.map((item) => {
                            const ItemIcon = categoryIconRegistry[item.iconName]

                            return (
                              <SelectItem key={item.id} value={item.id}>
                                <ItemIcon />
                                {item.name}
                              </SelectItem>
                            )
                          })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <DateTimeFields
                  idPrefix="balance-adjustment"
                  label="Thời gian"
                  required
                />

                <Field>
                  <FieldLabel htmlFor="balance-adjustment-note">
                    Ghi chú <Badge variant="outline">Tùy chọn</Badge>
                  </FieldLabel>
                  <Textarea
                    id="balance-adjustment-note"
                    name="note"
                    placeholder="Lý do điều chỉnh số dư..."
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </FieldGroup>
      </div>

      <SheetFooter>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !adjustmentType || !categoryId}
        >
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isPending ? "Đang lưu..." : "Lưu điều chỉnh"}
        </Button>
      </SheetFooter>
    </form>
  )
}
