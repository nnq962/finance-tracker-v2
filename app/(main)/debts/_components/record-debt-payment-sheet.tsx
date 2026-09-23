"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { AccountLogo } from "@/components/account-logo"
import { CurrencyInput } from "@/components/forms/currency-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Account } from "@/lib/accounts/types"
import { getLocalDateTime } from "@/lib/date-time"
import { formatCurrency } from "@/lib/format-currency"
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
  const baseDebt = payment ? { ...debt, paidAmount: debt.paidAmount - payment.amount, payments: debt.payments?.filter((item) => item.id !== payment.id) } : debt
  const { remainingAmount, interestAmount } = getPaymentMetrics(baseDebt, paidAt || todayDate())
  const isCollection = debt.direction === "lent"
  const actionLabel = payment ? (isCollection ? "Sửa khoản thu nợ" : "Sửa khoản trả nợ") : (isCollection ? "Ghi nhận thu nợ" : "Ghi nhận trả nợ")
  const eligibleAccounts = accounts.filter((account) => account.status === "active" || account.id === payment?.accountId)
  const accountGroups = [
    { type: "cash", label: "Tiền mặt" },
    { type: "bank", label: "Ngân hàng" },
    { type: "e-wallet", label: "Ví điện tử" },
  ] as const

  const changeOpen = (nextOpen: boolean) => {
      if (pending) return
      setOpen(nextOpen)
      if (nextOpen) {
        setAmount(payment?.amount ?? null)
        setPaidAt(payment?.paidAt ?? todayDate())
        setAccountId(payment?.accountId ?? "")
        setErrorMessage(null)
      }
  }

  return (
    <Sheet open={open} onOpenChange={changeOpen}>
      {typeof trigger === "function" ? trigger(() => changeOpen(true)) : <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent showCloseButton={!pending} className="data-[side=right]:w-full sm:max-w-md!" onOpenAutoFocus={(event) => event.preventDefault()} onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}>
        <SheetHeader>
          <SheetTitle>{actionLabel}</SheetTitle>
          <SheetDescription>{isCollection ? `Ghi lại tiền nhận từ ${contact.name}.` : `Ghi lại tiền trả cho ${contact.name}.`} Có thể thanh toán một phần hoặc toàn bộ.</SheetDescription>
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col" aria-busy={pending} onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          const data = new FormData(event.currentTarget)
          const account = eligibleAccounts.find((item) => item.id === accountId)
          if (!account) { setErrorMessage("Vui lòng chọn tài khoản."); return }
          submitting.current = true
          setPending(true)
          setErrorMessage(null)
          try {
            await onRecordPayment({ amount: amount ?? 0, accountId, accountName: account.name, paidAt, paidTime: String(data.get("paidTime")), note: String(data.get("note") || "").trim() || undefined })
            toast.success(payment ? "Đã cập nhật thanh toán." : "Đã ghi nhận thanh toán.")
            setOpen(false)
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Không thể lưu thanh toán.")
          } finally {
            submitting.current = false
            setPending(false)
          }
        }}>
          <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <FieldGroup>
              <Card>
                <CardHeader>
                  <CardTitle>Số tiền {isCollection ? "thu nợ" : "trả nợ"}</CardTitle>
                  <CardDescription>Còn lại tại ngày thanh toán: {formatCurrency(remainingAmount)}{debt.hasInterest ? ` (đã tính ${formatCurrency(interestAmount)} tiền lãi)` : ""}.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Field>
                      <FieldLabel htmlFor={`${id}-amount`}>Số tiền <Badge variant="secondary">VND</Badge></FieldLabel>
                      <CurrencyInput id={`${id}-amount`} name="amount" value={amount} required onValueChange={(value) => { setAmount(value); setErrorMessage(null) }} />
                    </Field>
                    <div className="flex flex-wrap gap-2" aria-label="Nhập nhanh số tiền còn lại">
                      {[{ label: "1/3 còn lại", divisor: 3 }, { label: "1/2 còn lại", divisor: 2 }, { label: "Toàn bộ", divisor: 1 }].map((choice) => (
                        <Button key={choice.divisor} type="button" variant="outline" size="sm" disabled={pending || remainingAmount < 1} onClick={() => { setAmount(Math.max(1, Math.floor(remainingAmount / choice.divisor))); setErrorMessage(null) }}>{choice.label}</Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Còn lại sau lần này: <span className="font-medium text-foreground">{formatCurrency(Math.max(0, remainingAmount - (amount ?? 0)))}</span></p>
                    {payment ? <p className="text-xs text-muted-foreground">Các lần thanh toán sau ngày này sẽ được kiểm tra lại khi lưu.</p> : null}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Thông tin thanh toán</CardTitle></CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={`${id}-account`}>{isCollection ? "Tài khoản nhận tiền" : "Nguồn tiền trả nợ"}</FieldLabel>
                      <Select value={accountId} onValueChange={setAccountId} required disabled={pending}>
                        <SelectTrigger id={`${id}-account`} className="w-full"><SelectValue placeholder="Chọn tài khoản" /></SelectTrigger>
                        <SelectContent>
                          {accountGroups.map((group) => {
                            const items = eligibleAccounts.filter((account) => account.type === group.type)
                            return items.length ? <SelectGroup key={group.type}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {items.map((account) => <SelectItem key={account.id} value={account.id} textValue={account.name}>
                                <AccountLogo account={account} className="size-5! p-0.5! [&>svg]:size-3!" />
                                <span className="min-w-0 truncate">{account.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{formatCurrency(account.balance)}</span>
                              </SelectItem>)}
                            </SelectGroup> : null
                          })}
                        </SelectContent>
                      </Select>
                      {eligibleAccounts.length === 0 ? <FieldError>Hãy thêm tài khoản trước khi ghi nhận thanh toán.</FieldError> : null}
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field><FieldLabel htmlFor={`${id}-date`}>Ngày thanh toán</FieldLabel><Input id={`${id}-date`} type="date" value={paidAt} min={debt.recordedAt} max={todayDate()} required onChange={(event) => { setPaidAt(event.target.value); setErrorMessage(null) }} /></Field>
                      <Field><FieldLabel htmlFor={`${id}-time`}>Giờ</FieldLabel><Input id={`${id}-time`} name="paidTime" type="time" defaultValue={payment?.paidTime ?? getLocalDateTime(new Date().toISOString()).time} required /></Field>
                    </div>
                    <Field><FieldLabel htmlFor={`${id}-note`}>Ghi chú</FieldLabel><Textarea id={`${id}-note`} name="note" defaultValue={payment?.note} maxLength={500} placeholder={isCollection ? "Ví dụ: Nhận tiền chuyển khoản" : "Ví dụ: Trả một phần khoản vay"} /></Field>
                  </FieldGroup>
                </CardContent>
              </Card>
              {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            </FieldGroup>
          </fieldset>
          <SheetFooter><Button type="submit" disabled={pending || !amount || amount <= 0 || !accountId || !paidAt}><CheckIcon />{pending ? "Đang lưu…" : payment ? "Lưu thay đổi" : isCollection ? "Xác nhận đã thu" : "Xác nhận đã trả"}</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
