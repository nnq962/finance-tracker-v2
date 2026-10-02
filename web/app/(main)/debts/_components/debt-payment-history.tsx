"use client"

import * as React from "react"
import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/animate-ui/components/radix/alert-dialog"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDebtDate } from "../_lib/debt-presentation"
import { getOpeningPaidAmount } from "../_lib/debt-payments"
import type { Contact, Debt, DebtPayment, NewDebtPayment } from "../_types/debt"
import { RecordDebtPaymentSheet } from "./record-debt-payment-sheet"

type Props = {
  debt: Debt
  contact: Contact
  accounts: Account[]
  onEdit: (id: string, values: NewDebtPayment) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function PaymentEntry({ payment, debt, contact, accounts, onEdit, onDelete }: Props & { payment: DebtPayment }) {
  const [deleting, setDeleting] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const submitting = React.useRef(false)
  const menuButton = React.useRef<HTMLButtonElement>(null)
  const openingDialog = React.useRef(false)
  const collecting = debt.direction === "lent"

  return (
    <>
      <SettingsRow
        title={<span className="tabular-nums"><span className="sr-only">{collecting ? "Đã thu " : "Đã trả "}</span>{collecting ? "+" : "−"}{formatCurrency(payment.amount)}</span>}
        description={[formatDebtDate(payment.paidAt), payment.accountName].filter(Boolean).join(" · ")}
        action={
          <RecordDebtPaymentSheet
            contact={contact}
            debt={debt}
            accounts={accounts}
            payment={payment}
            onRecordPayment={(values) => onEdit(payment.id, values)}
            returnFocusRef={menuButton}
            trigger={(openSheet) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button ref={menuButton} variant="ghost" size="icon-sm" aria-label={`Thao tác thanh toán ${formatCurrency(payment.amount)} ngày ${formatDebtDate(payment.paidAt)}`}><EllipsisIcon /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(event) => {
                  if (openingDialog.current) { event.preventDefault(); openingDialog.current = false }
                }}>
                  <DropdownMenuItem onSelect={() => { openingDialog.current = true; openSheet() }}><PencilIcon />Sửa giao dịch</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => { openingDialog.current = true; setErrorMessage(null); setDeleting(true) }}><Trash2Icon />Xoá giao dịch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        }
      />
      <AlertDialog open={deleting} onOpenChange={(nextOpen) => { if (!submitting.current) setDeleting(nextOpen) }}>
        <AlertDialogContent onCloseAutoFocus={(event) => { event.preventDefault(); menuButton.current?.focus() }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá giao dịch {collecting ? "thu nợ" : "trả nợ"}?</AlertDialogTitle>
            <AlertDialogDescription>Xoá lần thanh toán {formatCurrency(payment.amount)}. Số tiền còn lại và trạng thái khoản nợ sẽ được tính lại. Sau khi xác nhận, bạn có 6 giây để hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={async (event) => {
              event.preventDefault()
              if (submitting.current) return
              submitting.current = true
              setPending(true)
              setErrorMessage(null)
              try {
                await onDelete(payment.id)
                setDeleting(false)
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Không thể xoá thanh toán.")
              } finally {
                submitting.current = false
                setPending(false)
              }
            }}>{pending ? "Đang xoá…" : "Xoá giao dịch"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function DebtPaymentHistory(props: Props) {
  const { debt } = props
  const opening = getOpeningPaidAmount(debt)
  const payments = [...(debt.payments ?? [])].sort((a, b) => `${b.paidAt}T${b.paidTime ?? "00:00"}`.localeCompare(`${a.paidAt}T${a.paidTime ?? "00:00"}`))
  const collecting = debt.direction === "lent"

  return (
    <SettingsGroup title={`Lịch sử ${collecting ? "thu" : "trả"} (${payments.length})`}>
      {payments.map((payment) => <PaymentEntry key={payment.id} {...props} payment={payment} />)}
      {opening > 0 ? (
        <SettingsRow
          title={<span className="tabular-nums">{formatCurrency(opening)}</span>}
          description="Trước đây, chưa có ngày thanh toán"
        />
      ) : null}
      {payments.length === 0 && opening === 0 ? (
        <SettingsRow title={collecting ? "Chưa thu lần nào" : "Chưa trả lần nào"} />
      ) : null}
    </SettingsGroup>
  )
}
