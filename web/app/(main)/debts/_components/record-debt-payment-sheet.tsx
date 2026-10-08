"use client"

import * as React from "react"
import { CheckIcon, CircleCheckIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import { getLocalDateTime } from "@/lib/date-time"
import { formatCurrency } from "@/lib/format-currency"
import { scrollIntoViewWithin } from "@/lib/scroll-into-view"
import { actionErrorMessage } from "@/lib/stale-deploy"
import { cn } from "@/lib/utils"

import { AccountPicker } from "../../transactions/_components/add-transaction/fields/account-fields"
import { getPaymentMetrics, todayDate } from "../_lib/debt-payments"
import type { Contact, Debt, DebtPayment, NewDebtPayment } from "../_types/debt"
import { ContactAvatar } from "./contact-avatar"

type RecordDebtPaymentSheetProps = {
  contact: Contact
  debt: Debt
  accounts: Account[]
  payment?: DebtPayment
  onRecordPayment: (payment: NewDebtPayment) => Promise<void>
  trigger: React.ReactNode | ((openSheet: () => void) => React.ReactNode)
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
  /** With `payment`: a row at the end deletes it (with an undo), for where it cannot be swiped away. */
  onDelete?: () => void
}

/**
 * A collection or repayment of a debt, recorded or edited, laid out as the
 * other money forms: who pays whom over the amount, as payment apps show
 * the person, the amount large with all of what is left (how much it is on
 * the chip), half or a third a tap away, and what it
 * leaves (or that it settles the debt), then rows for the account it came
 * into or left, when, and a note.
 */
export function RecordDebtPaymentSheet({ trigger, returnFocusRef, ...formProps }: RecordDebtPaymentSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const collecting = formProps.debt.direction === "lent"

  const changeOpen = (nextOpen: boolean) => {
    if (pending) return
    setOpen(nextOpen)
  }

  return (
    <>
      {/* A trigger given as a function opens the sheet itself, from outside it. */}
      {typeof trigger === "function" ? trigger(() => changeOpen(true)) : null}
      <PageSheet
        title={formProps.payment ? (collecting ? "Sửa lần thu" : "Sửa lần trả") : collecting ? "Thu nợ" : "Trả nợ"}
        disabled={pending}
        open={open}
        onOpenChange={changeOpen}
        trigger={typeof trigger === "function" ? undefined : trigger}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault()
            returnFocusRef.current.focus()
          }
        }}
      >
        {/* Inside the sheet, so the accounts open as its deeper screen; it starts over each time the sheet opens. */}
        <PaymentForm {...formProps} pending={pending} onPendingChange={setPending} onDone={() => setOpen(false)} />
      </PageSheet>
    </>
  )
}

type PaymentField = "amount" | "accountId" | "paidAt"
const fieldOrder: PaymentField[] = ["amount", "accountId", "paidAt"]
const fieldIds: Record<PaymentField, string> = {
  amount: "payment-amount",
  accountId: "payment-account",
  paidAt: "payment-time-date-row",
}

/** All, half and a third of what is left. */
const SHARES = [
  { label: "Toàn bộ", divisor: 1 },
  { label: "1/2", divisor: 2 },
  { label: "1/3", divisor: 3 },
]

function PaymentForm({
  contact,
  debt,
  accounts,
  payment,
  onRecordPayment,
  onDelete,
  pending,
  onPendingChange,
  onDone,
}: Omit<RecordDebtPaymentSheetProps, "trigger" | "returnFocusRef"> & {
  pending: boolean
  onPendingChange: (pending: boolean) => void
  onDone: () => void
}) {
  const today = React.useMemo(() => todayDate(), [])
  const collecting = debt.direction === "lent"
  const eligibleAccounts = accounts.filter((account) => account.status === "active" || account.id === payment?.accountId)
  // A new payment starts on the account the debt's money moved through, when there is one still in use.
  const startAccount = payment?.accountId ?? (eligibleAccounts.some((account) => account.id === debt.accountId) ? debt.accountId : undefined)
  const [amount, setAmount] = React.useState<number | null>(payment?.amount ?? null)
  const [accountId, setAccountId] = React.useState(startAccount ?? "")
  const [paidAt, setPaidAt] = React.useState(payment?.paidAt ?? today)
  const [paidTime, setPaidTime] = React.useState(payment?.paidTime?.slice(0, 5) ?? getLocalDateTime(new Date()).time)
  const [errors, setErrors] = React.useState<Partial<Record<PaymentField, string>>>({})
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const submitting = React.useRef(false)
  const noteRef = React.useRef<HTMLTextAreaElement>(null)
  const clear = (field: PaymentField) =>
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })

  // What is left before this payment, on its day: an edited one's own amount is left out.
  const baseDebt = payment
    ? { ...debt, paidAmount: debt.paidAmount - payment.amount, payments: debt.payments?.filter((item) => item.id !== payment.id) }
    : debt
  const { remainingAmount } = getPaymentMetrics(baseDebt, /^\d{4}-\d{2}-\d{2}$/.test(paidAt) ? paidAt : today)
  const account = eligibleAccounts.find((item) => item.id === accountId)

  const [picking, setPicking] = React.useState(false)
  usePageSheetScreen(picking ? { title: collecting ? "Vào tài khoản" : "Trả từ", onBack: () => setPicking(false) } : null)

  const fitNote = (area: HTMLTextAreaElement) => {
    area.style.height = "auto"
    area.style.height = `${area.scrollHeight}px`
  }
  React.useLayoutEffect(() => {
    if (noteRef.current) fitNote(noteRef.current)
  }, [])

  const shareOf = (divisor: number) => Math.max(1, Math.floor(remainingAmount / divisor))
  const after = remainingAmount - (amount ?? 0)

  return (
    <form
      noValidate
      className="flex flex-1 flex-col"
      aria-busy={pending}
      onSubmit={async (event) => {
        event.preventDefault()
        if (submitting.current) return
        setErrorMessage(null)

        const found: Partial<Record<PaymentField, string>> = {}
        if (!(amount && amount > 0)) found.amount = "Nhập số tiền."
        else if (amount > remainingAmount) found.amount = `Nhiều hơn số còn lại (${formatCurrency(remainingAmount, { signDisplay: "never" })}).`
        if (!account) found.accountId = "Chọn tài khoản."
        if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt) || !/^\d{2}:\d{2}/.test(paidTime)) found.paidAt = "Chọn ngày và giờ."
        else if (paidAt > today) found.paidAt = "Không thể chọn ngày sau hôm nay."
        else if (paidAt < debt.recordedAt) found.paidAt = "Không thể chọn ngày trước ngày ghi khoản nợ."
        setErrors(found)
        const first = fieldOrder.find((field) => found[field])
        if (first || !account) {
          const element = first ? document.getElementById(fieldIds[first]) : null
          element?.focus({ preventScroll: true })
          if (element) scrollIntoViewWithin(element)
          return
        }

        submitting.current = true
        onPendingChange(true)
        try {
          await onRecordPayment({
            amount: amount ?? 0,
            accountId,
            accountName: account.name,
            paidAt,
            paidTime,
            note: noteRef.current?.value.trim() || undefined,
          })
          toast.success(payment ? "Đã cập nhật thanh toán." : "Đã ghi nhận thanh toán.")
          onDone()
        } catch (error) {
          setErrorMessage(actionErrorMessage(error, "Không thể lưu thanh toán."))
        } finally {
          submitting.current = false
          onPendingChange(false)
        }
      }}
    >
      {picking ? (
        <AccountPicker
          accounts={eligibleAccounts}
          value={accountId}
          onPick={(id) => {
            setAccountId(id)
            clear("accountId")
            setPicking(false)
          }}
        />
      ) : null}

      <fieldset disabled={pending} className={cn("flex min-w-0 flex-col gap-6 pb-4", picking && "hidden")}>
        {/* Who pays whom, over the amount, as payment apps show the person above it; what is left is on "Toàn bộ". */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center pt-2 text-center">
            <ContactAvatar contactId={contact.id} initials={contact.initials} size="lg" />
            <p className="mt-3 text-base font-medium">{collecting ? `${contact.name} trả bạn` : `Bạn trả ${contact.name}`}</p>
            {debt.note || debt.hasInterest ? (
              <p className="text-sm text-muted-foreground">
                {[debt.note, debt.hasInterest ? "tính cả lãi" : undefined].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <FieldLabel htmlFor="payment-amount" className="sr-only">
            {collecting ? "Số tiền thu" : "Số tiền trả"}
          </FieldLabel>
          <CurrencyInput
            variant="hero"
            id="payment-amount"
            name="amount"
            value={amount}
            sign={collecting ? "+" : "−"}
            tone={collecting ? "income" : "default"}
            suggestions={false}
            onValueChange={(value) => {
              setAmount(value)
              clear("amount")
            }}
            invalid={Boolean(errors.amount)}
            required
          />
          <ToggleGroup
            type="single"
            size="sm"
            value={SHARES.find((share) => amount === shareOf(share.divisor))?.label ?? ""}
            onValueChange={(label) => {
              const share = SHARES.find((item) => item.label === label)
              if (!share) return
              setAmount(shareOf(share.divisor))
              clear("amount")
            }}
            disabled={pending || remainingAmount < 1}
            aria-label="Chọn nhanh phần còn lại"
          >
            {SHARES.map((share) => (
              <ToggleGroupItem key={share.label} value={share.label}>
                {/* All of it says how much that is: what is left on the debt. */}
                {share.divisor === 1 ? `${share.label} ${formatCurrency(remainingAmount, { signDisplay: "never" })}` : share.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {errors.amount ? (
            <FieldError className="text-center">{errors.amount}</FieldError>
          ) : amount ? (
            after <= 0 ? (
              <p className="flex items-center gap-1.5 text-sm text-income">
                <CircleCheckIcon className="size-4" aria-hidden="true" />
                Tất toán khoản này
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sau lần này còn{" "}
                <span className="font-medium text-foreground tabular-nums">{formatCurrency(after, { signDisplay: "never" })}</span>
              </p>
            )
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <SettingsGroup>
            <SettingsRow
              id="payment-account"
              title={collecting ? "Vào tài khoản" : "Trả từ"}
              value={
                <span className={cn("flex min-w-0 items-center gap-2", errors.accountId && "text-destructive")}>
                  {account ? <AccountLogo account={account} size="xs" /> : null}
                  <span className="min-w-0 truncate">
                    {account?.name ?? (eligibleAccounts.length === 0 ? "Chưa có tài khoản" : "Chọn tài khoản")}
                  </span>
                </span>
              }
              disabled={eligibleAccounts.length === 0}
              onClick={() => setPicking(true)}
            />
            <TimeRows
              idPrefix="payment-time"
              date={paidAt}
              time={paidTime}
              today={today}
              min={debt.recordedAt}
              onDateChange={(date) => {
                setPaidAt(date)
                clear("paidAt")
                clear("amount")
              }}
              onTimeChange={(time) => {
                setPaidTime(time)
                clear("paidAt")
              }}
              invalid={Boolean(errors.paidAt)}
            />
            {/* The note typed in place, as tall as a row (64) and growing with what is written. */}
            <li className={cn("flex min-h-16 items-center px-4 py-3", settingsSeparatorClassName())}>
              <label htmlFor="payment-note" className="sr-only">
                Ghi chú
              </label>
              <textarea
                ref={noteRef}
                id="payment-note"
                name="note"
                rows={1}
                defaultValue={payment?.note}
                placeholder="Ghi chú (tuỳ chọn)"
                maxLength={500}
                onInput={(event) => fitNote(event.currentTarget)}
                className="block min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </li>
          </SettingsGroup>
          {errors.accountId || errors.paidAt ? (
            <FieldError className="px-4">{errors.accountId ?? errors.paidAt}</FieldError>
          ) : eligibleAccounts.length === 0 ? (
            <FieldError className="px-4">Cần có tài khoản trước.</FieldError>
          ) : null}
        </div>

      </fieldset>

      {picking ? null : (
        <PageSheetFooter>
          {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
          {/* Deleting sits beside saving, as tall as it (with an undo, so the two side by side are safe). */}
          <div className="flex items-center gap-2">
            {payment && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                aria-label={collecting ? "Xoá lần thu này" : "Xoá lần trả này"}
                disabled={pending}
                onClick={() => {
                  onDone()
                  onDelete()
                }}
              >
                <Trash2Icon />
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" disabled={pending}>
              <CheckIcon />
              {pending ? "Đang lưu…" : payment ? "Lưu thay đổi" : collecting ? "Xác nhận đã thu" : "Xác nhận đã trả"}
            </Button>
          </div>
        </PageSheetFooter>
      )}
    </form>
  )
}
