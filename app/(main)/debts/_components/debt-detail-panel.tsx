"use client"

import * as React from "react"
import { AddDebtSheet } from "./add-debt-sheet"
import { FieldError } from "@/components/ui/field"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/animate-ui/components/radix/alert-dialog"
import {
  PencilIcon,
  Trash2Icon,
  CheckIcon,
  PhoneIcon,
} from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { DebtPaymentHistory } from "./debt-payment-history"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/format-currency"

import {
  formatDebtDate,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt, NewDebt, NewDebtPayment } from "../_types/debt"
import { RecordDebtPaymentSheet } from "./record-debt-payment-sheet"

type DebtDetailPanelProps = {
  contacts: Contact[]
  onChangeDebt: (values: NewDebt | null) => Promise<void>
  accounts: Account[]
  onEditPayment: (id: string, values: NewDebtPayment) => Promise<void>
  onDeletePayment: (id: string) => Promise<void>
  contact: Contact
  debt: Debt
  onRecordPayment: (payment: NewDebtPayment) => Promise<void>
}

export function DebtDetailPanel({
  contacts,
  onChangeDebt,
  contact,
  debt,
  onRecordPayment,
  accounts,
  onEditPayment,
  onDeletePayment,
}: DebtDetailPanelProps) {
  const [deleting, setDeleting] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const submitting = React.useRef(false)
  const { paidAmount, remainingAmount, paymentProgress, interestAmount, interestDate, totalAmount, days } = getDebtMetrics(debt)
  const deadline = getDebtDeadline(debt)
  const paymentAction = debt.direction === "lent" ? "Ghi nhận thu" : "Ghi nhận trả"

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="h-16 content-center">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>{contact.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle>{contact.name}</CardTitle>
            {contact.phone ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <PhoneIcon className="size-3.5" />
                {contact.phone}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={debt.direction === "lent" ? "secondary" : "destructive"}
            className={
              debt.direction === "lent"
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : undefined
            }
          >
            {debt.direction === "lent" ? "Cho vay" : "Đi vay"}
          </Badge>
          {debt.recordingMode === "opening" ? <Badge variant="outline">Nợ có sẵn</Badge> : null}
          <Badge variant={deadline.isOverdue ? "destructive" : "outline"}>
            {deadline.label}
          </Badge>
        </div>

        <div>
          <p className="font-semibold">{debt.note}</p>
        </div>

        <div className="space-y-3 rounded-lg bg-muted p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Tiền gốc</span>
            <span className="shrink-0 text-right font-medium tabular-nums">
              {formatCurrency(debt.amount, { signDisplay: "never" })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Lãi suất</span>
            <span className="shrink-0 text-right tabular-nums">{debt.hasInterest ? `${debt.interestRate ?? 0}%/${debt.interestPeriod === "year" ? "năm" : "tháng"}` : "Không tính lãi"}</span>
          </div>
          {debt.hasInterest ? <>
            <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">Tiền lãi · {days} ngày</span><span className="shrink-0 text-right font-medium tabular-nums">{formatCurrency(interestAmount)}</span></div>
            <p className="text-sm text-orange-700 dark:text-orange-400">Lãi đơn trên gốc ban đầu, {debt.interestPeriod === "year" ? "365 ngày/năm" : "30 ngày/tháng"}, đến {formatDebtDate(interestDate)}. Dừng tính lãi khi tất toán.</p>
            <div className="flex items-center justify-between gap-4 text-sm"><span>Tổng gốc và lãi</span><span className="shrink-0 text-right font-medium tabular-nums">{formatCurrency(totalAmount)}</span></div>
          </> : null}
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              {debt.direction === "lent" ? "Đã thu" : "Đã trả"}
            </span>
            <span className="shrink-0 text-right font-medium tabular-nums">
              {formatCurrency(paidAmount, { signDisplay: "never" })}
            </span>
          </div>
          <Separator />
          <div className="flex items-end justify-between gap-4">
            <span className="text-sm text-muted-foreground">Còn lại</span>
            <span className="shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatCurrency(remainingAmount, { signDisplay: "never" })}
            </span>
          </div>
          <Progress value={paymentProgress} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{debt.recordingMode === "opening" ? "Ngày bắt đầu theo dõi" : "Ngày ghi"}</p>
            <p className="font-medium">{formatDebtDate(debt.recordedAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hẹn trả</p>
            <p className={deadline.isOverdue ? "font-medium text-destructive" : "font-medium"}>
              {debt.dueAt ? formatDebtDate(debt.dueAt) : "Không có"}
            </p>
          </div>
        </div>

        <DebtPaymentHistory debt={debt} contact={contact} accounts={accounts} onEdit={onEditPayment} onDelete={onDeletePayment} />

        <RecordDebtPaymentSheet
          accounts={accounts}
          contact={contact}
          debt={debt}
          onRecordPayment={onRecordPayment}
          trigger={
            <Button className="w-full" disabled={remainingAmount <= 0 || !accounts.some((account) => account.status === "active")}>
              <CheckIcon />
              {paymentAction}
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-2">
          <AddDebtSheet debt={debt} contacts={contacts} accounts={accounts} onAddDebt={onChangeDebt}
            trigger={<Button variant="outline"><PencilIcon />Sửa khoản nợ</Button>} />
          <Button variant="outline" onClick={() => { setError(null); setDeleting(true) }}><Trash2Icon />Xoá khoản nợ</Button>
        </div>
        <AlertDialog open={deleting} onOpenChange={(open) => { if (!submitting.current) setDeleting(open) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá khoản {debt.direction === "lent" ? "cho vay" : "đi vay"}?</AlertDialogTitle>
              <AlertDialogDescription>
                Xoá “{debt.note}” cùng toàn bộ {debt.payments?.length ?? 0} lần thu/trả.
                {debt.recordingMode === "opening" ? " Chỉ hoàn tác tác động số dư của các lần thu/trả đã ghi nhận; tiền gốc không ảnh hưởng số dư." : " Xoá giao dịch ban đầu và điều chỉnh số dư các tài khoản như chưa từng có khoản nợ này."}
                {" "}Hành động không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error ? <FieldError role="alert">{error}</FieldError> : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Huỷ</AlertDialogCancel>
              <AlertDialogAction disabled={pending} onClick={async (event) => {
                event.preventDefault()
                if (submitting.current) return
                submitting.current = true
                setPending(true)
                setError(null)
                try {
                  await onChangeDebt(null)
                  setDeleting(false)
                } catch (error) {
                  setError(error instanceof Error ? error.message : "Không thể xoá khoản nợ.")
                } finally {
                  submitting.current = false
                  setPending(false)
                }
              }}>{pending ? "Đang xoá…" : "Xoá khoản nợ"}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
