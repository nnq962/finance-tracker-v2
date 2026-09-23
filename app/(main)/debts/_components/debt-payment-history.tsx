"use client"

import * as React from "react"
import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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

function TimelineItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pb-2 pl-6 last:pb-0 before:absolute before:-bottom-4 before:left-[3.5px] before:top-4 before:w-px before:bg-border last:before:hidden">
      <span aria-hidden="true" className="absolute left-0 top-3 size-2 rounded-full border-2 border-muted-foreground bg-card" />
      {children}
    </li>
  )
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
    <TimelineItem>
      <div className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2">
        <time dateTime={payment.paidAt} className="min-w-0 text-xs text-muted-foreground tabular-nums">{formatDebtDate(payment.paidAt)}</time>
        <p className="shrink-0 text-right text-sm font-medium tabular-nums"><span className="sr-only">{collecting ? "Đã thu " : "Đã trả "}</span>{collecting ? "+" : "−"}{formatCurrency(payment.amount)}</p>
        <div className="shrink-0">
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
        </div>

      </div>
      <AlertDialog open={deleting} onOpenChange={(nextOpen) => { if (!submitting.current) setDeleting(nextOpen) }}>
        <AlertDialogContent onCloseAutoFocus={(event) => { event.preventDefault(); menuButton.current?.focus() }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá giao dịch {collecting ? "thu nợ" : "trả nợ"}?</AlertDialogTitle>
            <AlertDialogDescription>Xoá lần thanh toán {formatCurrency(payment.amount)}. Số tiền còn lại và trạng thái khoản nợ sẽ được tính lại.</AlertDialogDescription>
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
                toast.success("Đã xoá thanh toán.")
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
    </TimelineItem>
  )
}

export function DebtPaymentHistory(props: Props) {
  const { debt } = props
  const opening = getOpeningPaidAmount(debt)
  const payments = [...(debt.payments ?? [])].sort((a, b) => `${b.paidAt}T${b.paidTime ?? "00:00"}`.localeCompare(`${a.paidAt}T${a.paidTime ?? "00:00"}`))

  return (
    <section className="space-y-3" aria-label="Lịch sử thanh toán">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Lịch sử thanh toán</h3>
        {payments.length > 0 ? <Badge variant="outline">{payments.length} giao dịch</Badge> : null}
      </div>
      {payments.length > 0 || opening > 0 ? (
        <ol aria-label="Thanh toán mới nhất trước">
          {payments.map((payment) => <PaymentEntry key={payment.id} {...props} payment={payment} />)}
          {opening > 0 ? (
            <TimelineItem>
              <div className="grid min-h-8 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2">
                <p className="text-xs text-muted-foreground" title="Số tiền đã ghi nhận trước đây, chưa có ngày thanh toán">Trước đây</p>
                <p className="shrink-0 text-right text-sm font-medium tabular-nums">{formatCurrency(opening)}</p>
                <span aria-hidden="true" className="size-8" />
              </div>
            </TimelineItem>
          ) : null}
        </ol>
      ) : null}
      {payments.length === 0 && opening === 0 ? <p className="text-sm text-muted-foreground">Chưa có thanh toán.</p> : null}
    </section>
  )
}
