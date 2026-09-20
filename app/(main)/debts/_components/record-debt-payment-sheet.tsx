"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/format-currency"

import { getDebtMetrics } from "../_lib/debt-presentation"
import type { Contact, Debt, NewDebtPayment } from "../_types/debt"

type RecordDebtPaymentSheetProps = {
  contact: Contact
  debt: Debt
  onRecordPayment: (payment: NewDebtPayment) => void
  trigger: React.ReactNode
}

export function RecordDebtPaymentSheet({
  contact,
  debt,
  onRecordPayment,
  trigger,
}: RecordDebtPaymentSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState<number | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const { remainingAmount } = getDebtMetrics(debt)
  const isCollection = debt.direction === "lent"
  const actionLabel = isCollection ? "Ghi nhận thu" : "Ghi nhận trả"
  const amountAfterPayment = Math.max(remainingAmount - (amount ?? 0), 0)

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setAmount(null)
          setErrorMessage(null)
        }
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{actionLabel}</SheetTitle>
          <SheetDescription>
            {isCollection
              ? `Ghi lại khoản tiền đã nhận từ ${contact.name}.`
              : `Ghi lại khoản tiền đã trả cho ${contact.name}.`}
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)
            const paymentAmount = Number(formData.get("amount"))

            if (!paymentAmount || paymentAmount <= 0) {
              setErrorMessage("Vui lòng nhập số tiền lớn hơn 0.")
              return
            }

            if (paymentAmount > remainingAmount) {
              setErrorMessage("Số tiền không được lớn hơn số dư còn lại.")
              return
            }

            onRecordPayment({
              amount: paymentAmount,
              paidAt: String(formData.get("paidAt")),
              paidTime: String(formData.get("paidTime")),
              note: String(formData.get("note") || "") || undefined,
            })
            toast.success(isCollection ? "Đã ghi nhận khoản thu." : "Đã ghi nhận khoản trả.")
            form.reset()
            setOpen(false)
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <FieldGroup>
              <Card>
                <CardHeader>
                  <CardTitle>Số tiền {isCollection ? "đã thu" : "đã trả"}</CardTitle>
                  <CardDescription>
                    Nhập số tiền thực tế của lần thanh toán này.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="secondary">VND</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field data-invalid={Boolean(errorMessage)}>
                    <FieldLabel htmlFor="debt-payment-amount" className="sr-only">
                      Số tiền {isCollection ? "đã thu" : "đã trả"}
                    </FieldLabel>
                    <CurrencyInput
                      id="debt-payment-amount"
                      name="amount"
                      onValueChange={(value) => {
                        setAmount(value)
                        setErrorMessage(null)
                      }}
                      required
                    />
                    {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Còn lại hiện tại</p>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(remainingAmount, { signDisplay: "never" })}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">Sau thanh toán</p>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(amountAfterPayment, { signDisplay: "never" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin thanh toán</CardTitle>
                  <CardDescription>
                    Ghi lại thời gian và nội dung cần nhớ.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <DateTimeFields
                      idPrefix="debt-payment"
                      dateName="paidAt"
                      timeName="paidTime"
                      label="Thời gian"
                      required
                    />
                    <Field>
                      <FieldLabel htmlFor="debt-payment-note">
                        Ghi chú <Badge variant="outline">Tùy chọn</Badge>
                      </FieldLabel>
                      <Textarea
                        id="debt-payment-note"
                        name="note"
                        placeholder={
                          isCollection
                            ? "Ví dụ: Nhận tiền chuyển khoản..."
                            : "Ví dụ: Trả qua tài khoản ngân hàng..."
                        }
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            </FieldGroup>
          </div>

          <SheetFooter>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!amount || amount <= 0 || amount > remainingAmount}
            >
              <CheckIcon />
              Xác nhận {isCollection ? "đã thu" : "đã trả"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
