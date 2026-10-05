"use client"

import * as React from "react"
import { AddDebtSheet } from "./add-debt-sheet"
import { FieldError } from "@/components/ui/field"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CheckIcon } from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { DebtPaymentHistory } from "./debt-payment-history"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/format-currency"
import { actionErrorMessage } from "@/lib/stale-deploy"

import {
  formatDebtDate,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt, NewDebt, NewDebtPayment } from "../_types/debt"
import { RecordDebtPaymentSheet } from "./record-debt-payment-sheet"
import { getDueProjection, todayDate } from "../_lib/debt-payments"

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

/** Side panel beside the list (xl and up); below xl the same content opens in a sheet. */
export function DebtDetailPanel(props: DebtDetailPanelProps) {
  return (
    <section aria-labelledby="debt-detail-title" className="space-y-2">
      {/* A caption like the summary's beside it, so both columns start on one line. */}
      <div className="flex min-h-6 items-center px-3">
        <h2
          id="debt-detail-title"
          className="truncate text-xs font-semibold text-muted-foreground"
        >
          {props.contact.name}
        </h2>
      </div>
      <div className="space-y-6">
        <DebtDetailInfo {...props} />
        <DebtRecordPaymentButton {...props} />
      </div>
    </section>
  )
}

/** Debt figures, payment history and edit/delete; shared by the side panel and the sheet. */
export function DebtDetailInfo(props: DebtDetailPanelProps) {
  const { contact, debt, accounts, onEditPayment, onDeletePayment } = props
  const { paidAmount, remainingAmount, paymentProgress, interestAmount, interestDate, totalAmount, days } = getDebtMetrics(debt)
  const deadline = getDebtDeadline(debt)
  const collecting = debt.direction === "lent"
  const paidLabel = collecting ? "Đã thu" : "Đã trả"
  const projection = getDueProjection(debt, paidAmount)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{debt.hasInterest ? "Còn lại hôm nay" : "Còn lại"}</p>
          <p className="text-3xl leading-tight font-bold tabular-nums [overflow-wrap:anywhere]">
            {formatCurrency(remainingAmount, { signDisplay: "never" })}
          </p>
          <Progress value={paymentProgress} />
          <p className="text-xs text-muted-foreground">
            {paidLabel} {formatCurrency(paidAmount, { signDisplay: "never" })} / {formatCurrency(totalAmount, { signDisplay: "never" })} · {Math.round(paymentProgress)}%
          </p>
          {debt.hasInterest ? (
            <p className="text-xs text-muted-foreground">
              Gốc {formatCurrency(debt.amount, { signDisplay: "never" })} + lãi {formatCurrency(interestAmount)}
            </p>
          ) : null}
          {projection ? (
            // What it comes to on the due date, as interest keeps accruing until then.
            <p className="text-sm text-muted-foreground">
              Đến hạn {formatDebtDate(projection.dueAt)}:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(projection.remainingAmount)}
              </span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <SettingsGroup
        footer={debt.hasInterest
          ? "Lãi đơn trên tiền gốc, cộng dồn theo ngày"
          : undefined}
      >
        <SettingsRow title="Loại" value={collecting ? "Cho vay" : "Đi vay"} />
        <SettingsRow title="Tiền gốc" value={formatCurrency(debt.amount, { signDisplay: "never" })} />
        <SettingsRow
          title="Lãi suất"
          value={debt.hasInterest ? `${debt.interestRate ?? 0}%/${debt.interestPeriod === "year" ? "năm" : "tháng"}` : "Không tính lãi"}
        />
        {debt.hasInterest ? (
          <>
            {/* What a full period adds, so a loan opened today still shows its interest. */}
            <SettingsRow
              title={`Lãi mỗi ${debt.interestPeriod === "year" ? "năm" : "tháng"}`}
              value={formatCurrency(Math.round((debt.amount * (debt.interestRate ?? 0)) / 100))}
            />
            <SettingsRow
              title={`Lãi đến ${interestDate === todayDate() ? "hôm nay" : formatDebtDate(interestDate)}`}
              description={`${days} ngày`}
              value={formatCurrency(interestAmount)}
            />
            <SettingsRow title="Tổng gốc và lãi" value={formatCurrency(totalAmount)} />
          </>
        ) : null}
        {debt.note ? <SettingsRow title="Ghi chú" description={debt.note} /> : null}
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          title={debt.recordingMode === "opening" ? "Ngày bắt đầu theo dõi" : "Ngày ghi"}
          value={formatDebtDate(debt.recordedAt)}
        />
        {debt.dueAt ? (
          <SettingsRow
            title="Hẹn trả"
            description={debt.status !== "settled" ? deadline.label : undefined}
            value={formatDebtDate(debt.dueAt)}
          />
        ) : null}
        <SettingsRow
          title="Cách ghi nhận"
          value={debt.recordingMode === "opening" ? "Nợ có sẵn" : "Khoản vay mới"}
        />
      </SettingsGroup>

      <DebtPaymentHistory debt={debt} contact={contact} accounts={accounts} onEdit={onEditPayment} onDelete={onDeletePayment} />

      <DebtManageRows {...props} />
    </div>
  )
}

/** Records a collection or repayment; the sheet places it in its footer. */
export function DebtRecordPaymentButton({
  contact,
  debt,
  onRecordPayment,
  accounts,
}: DebtDetailPanelProps) {
  const { remainingAmount } = getDebtMetrics(debt)
  const paymentAction = debt.direction === "lent" ? "Ghi nhận thu" : "Ghi nhận trả"

  return (
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
  )
}

/** Edit and delete as rows at the end, like the other editors. */
function DebtManageRows({
  accounts,
  contacts,
  debt,
  onChangeDebt,
}: DebtDetailPanelProps) {
  const [editing, setEditing] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const submitting = React.useRef(false)

  return (
    <>
      <SettingsGroup>
        <SettingsRow title="Sửa khoản nợ" onClick={() => setEditing(true)} />
      </SettingsGroup>
      <SettingsGroup>
        <SettingsRow
          destructive
          title="Xoá khoản nợ"
          onClick={() => {
            setError(null)
            setDeleting(true)
          }}
        />
      </SettingsGroup>
      <AddDebtSheet
        debt={debt}
        contacts={contacts}
        accounts={accounts}
        onAddDebt={onChangeDebt}
        open={editing}
        onOpenChange={setEditing}
      />
      <AlertDialog open={deleting} onOpenChange={(open) => { if (!submitting.current) setDeleting(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá khoản {debt.direction === "lent" ? "cho vay" : "đi vay"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Xoá {debt.note ? `“${debt.note}”` : "khoản này"} cùng toàn bộ {debt.payments?.length ?? 0} lần thu/trả.
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
                setError(actionErrorMessage(error, "Không thể xoá khoản nợ."))
              } finally {
                submitting.current = false
                setPending(false)
              }
            }}>{pending ? "Đang xoá…" : "Xoá khoản nợ"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
