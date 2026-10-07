"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { FormSection } from "@/components/app/form-section"
import { AccountSelectGroups } from "@/components/account-select-groups"
import { CurrencyInput } from "@/components/forms/currency-input"
import { RequiredMark } from "@/components/forms/required-mark"
import { useFieldErrors } from "@/components/forms/use-field-errors"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Account } from "@/lib/accounts/types"
import { getLocalDateTime } from "@/lib/date-time"
import { formatCurrency } from "@/lib/format-currency"
import { actionErrorMessage } from "@/lib/stale-deploy"
import { getPaymentMetrics, todayDate } from "../_lib/debt-payments"
import type { Contact, Debt, DebtPayment, NewDebtPayment } from "../_types/debt"

type RecordDebtPaymentSheetProps = {
  contact: Contact
  debt: Debt
  accounts: Account[]
  payment?: DebtPayment
  onRecordPayment: (payment: NewDebtPayment) => Promise<void>
  trigger: React.ReactNode | ((openSheet: () => void) => React.ReactNode)
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
}

export function RecordDebtPaymentSheet({ contact, debt, accounts, payment, onRecordPayment, trigger, returnFocusRef }: RecordDebtPaymentSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [amount, setAmount] = React.useState<number | null>(payment?.amount ?? null)
  const [paidAt, setPaidAt] = React.useState(payment?.paidAt ?? todayDate())
  const [accountId, setAccountId] = React.useState(payment?.accountId ?? "")
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const submitting = React.useRef(false)
  const id = React.useId()
  const { errors, clear, report, reset: resetErrors } = useFieldErrors<"amount" | "accountId" | "paidAt">()
  const baseDebt = payment ? { ...debt, paidAmount: debt.paidAmount - payment.amount, payments: debt.payments?.filter((item) => item.id !== payment.id) } : debt
  const { remainingAmount } = getPaymentMetrics(baseDebt, paidAt || todayDate())
  const isCollection = debt.direction === "lent"
  // The person is named in the title now that sheets carry no description.
  const actionLabel = payment ? (isCollection ? "Sửa khoản thu nợ" : "Sửa khoản trả nợ") : (isCollection ? `Thu nợ từ ${contact.name}` : `Trả nợ cho ${contact.name}`)
  const eligibleAccounts = accounts.filter((account) => account.status === "active" || account.id === payment?.accountId)

  const changeOpen = (nextOpen: boolean) => {
      if (pending) return
      setOpen(nextOpen)
      if (nextOpen) {
        setAmount(payment?.amount ?? null)
        setPaidAt(payment?.paidAt ?? todayDate())
        setAccountId(payment?.accountId ?? "")
        setErrorMessage(null)
        resetErrors()
      }
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      {typeof trigger === "function" ? trigger(() => changeOpen(true)) : <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent showCloseButton={false} aria-describedby={undefined} variant="screen" onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}>
        <SheetNavHeader
          title={actionLabel}
          disabled={pending}
        />
        <form noValidate className="flex min-h-0 flex-1 flex-col" aria-busy={pending} onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          const data = new FormData(event.currentTarget)
          const account = eligibleAccounts.find((item) => item.id === accountId)
          const found: Partial<Record<"amount" | "accountId" | "paidAt", string>> = {}
          if (!(amount && amount > 0)) found.amount = "Nhập số tiền."
          if (!account) found.accountId = "Chọn tài khoản."
          if (!paidAt || !data.get("paidTime")) found.paidAt = "Chọn ngày và giờ."
          else if (paidAt > todayDate()) found.paidAt = "Không thể chọn ngày sau hôm nay."
          else if (paidAt < debt.recordedAt) found.paidAt = "Không thể chọn ngày trước ngày ghi khoản nợ."
          if (report(found, ["amount", "accountId", "paidAt"], (name) => ({ amount: `${id}-amount`, accountId: `${id}-account`, paidAt: `${id}-date` })[name]) || !account) return
          submitting.current = true
          setPending(true)
          setErrorMessage(null)
          try {
            await onRecordPayment({ amount: amount ?? 0, accountId, accountName: account.name, paidAt, paidTime: String(data.get("paidTime")), note: String(data.get("note") || "").trim() || undefined })
            toast.success(payment ? "Đã cập nhật thanh toán." : "Đã ghi nhận thanh toán.")
            setOpen(false)
          } catch (error) {
            setErrorMessage(actionErrorMessage(error, "Không thể lưu thanh toán."))
          } finally {
            submitting.current = false
            setPending(false)
          }
        }}>
          <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <FormSection>
              <FieldGroup>
                <Field data-invalid={Boolean(errors.amount) || undefined}>
                  <FieldLabel htmlFor={`${id}-amount`}>Số tiền <RequiredMark /></FieldLabel>
                  <CurrencyInput id={`${id}-amount`} name="amount" value={amount} required invalid={Boolean(errors.amount)} onValueChange={(value) => { setAmount(value); setErrorMessage(null); clear("amount") }} />
                  <div className="flex flex-wrap gap-2" aria-label="Nhập nhanh số tiền còn lại">
                    {[{ label: "1/3 còn lại", divisor: 3 }, { label: "1/2 còn lại", divisor: 2 }, { label: "Toàn bộ", divisor: 1 }].map((choice) => (
                      <Button key={choice.divisor} type="button" variant="outline" size="sm" disabled={pending || remainingAmount < 1} onClick={() => { setAmount(Math.max(1, Math.floor(remainingAmount / choice.divisor))); setErrorMessage(null); clear("amount") }}>{choice.label}</Button>
                    ))}
                  </div>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Đang còn{debt.hasInterest ? " (gồm lãi)" : ""}</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(remainingAmount)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Sau lần này</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(Math.max(0, remainingAmount - (amount ?? 0)))}</dd>
                    </div>
                  </dl>
                  {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}
                </Field>
                <Field data-invalid={Boolean(errors.accountId) || undefined}>
                  <FieldLabel htmlFor={`${id}-account`}>{isCollection ? "Tài khoản nhận tiền" : "Nguồn tiền trả nợ"} <RequiredMark /></FieldLabel>
                  <Select value={accountId} onValueChange={(value) => { setAccountId(value); clear("accountId") }} required disabled={pending || eligibleAccounts.length === 0}>
                    <SelectTrigger id={`${id}-account`} className="w-full" aria-invalid={Boolean(errors.accountId) || undefined}><SelectValue placeholder="Chọn tài khoản" /></SelectTrigger>
                    <SelectContent>
                      <AccountSelectGroups accounts={eligibleAccounts} />
                    </SelectContent>
                  </Select>
                  {errors.accountId ? <FieldError>{errors.accountId}</FieldError> : eligibleAccounts.length === 0 ? <FieldError>Cần có tài khoản trước</FieldError> : null}
                </Field>
                <DateTimeFields
                  idPrefix={id}
                  label={<>Thời gian <RequiredMark /></>}
                  dateName="paidAt"
                  timeName="paidTime"
                  dateValue={paidAt}
                  defaultTime={payment?.paidTime ?? getLocalDateTime(new Date().toISOString()).time}
                  minDate={debt.recordedAt}
                  maxDate={todayDate()}
                  onDateChange={(event) => {
                    setPaidAt(event.target.value)
                    setErrorMessage(null)
                    clear("paidAt")
                  }}
                  onTimeChange={() => clear("paidAt")}
                  error={errors.paidAt}
                  required
                />
                <Field><FieldLabel htmlFor={`${id}-note`}>Ghi chú</FieldLabel><Textarea id={`${id}-note`} name="note" defaultValue={payment?.note} maxLength={500} /></Field>
              </FieldGroup>
            </FormSection>
          </fieldset>
          <SheetFooter>
            {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            <Button type="submit" className="w-full" disabled={pending}><CheckIcon />{pending ? "Đang lưu…" : payment ? "Lưu thay đổi" : isCollection ? "Xác nhận đã thu" : "Xác nhận đã trả"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
