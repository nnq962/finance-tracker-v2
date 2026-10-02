"use client"

import * as React from "react"
import { AddDebtSheet } from "./add-debt-sheet"
import { FieldError } from "@/components/ui/field"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/animate-ui/components/radix/alert-dialog"
import { CheckIcon } from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { DebtPaymentHistory } from "./debt-payment-history"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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

/** Subtitle under the contact's name: what the debt is for and which way. */
export function getDebtSubtitle(debt: Debt) {
  return `${debt.note} · ${debt.direction === "lent" ? "Cho vay" : "Đi vay"}`
}

/** Side panel beside the list (xl and up); below xl the same content opens in a sheet. */
export function DebtDetailPanel(props: DebtDetailPanelProps) {
  return (
    <section aria-labelledby="debt-detail-title" className="space-y-6">
      <div className="space-y-1 px-3">
        <h2 id="debt-detail-title" className="truncate font-heading text-lg font-extrabold">
          {props.contact.name}
        </h2>
        <p className="text-sm text-muted-foreground">{getDebtSubtitle(props.debt)}</p>
      </div>
      <DebtDetailInfo {...props} />
      <DebtRecordPaymentButton {...props} />
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

  return (
    <div className="space-y-6">
      <div className="space-y-2 px-3">
        <p className="text-sm text-muted-foreground">Còn lại</p>
        <p className="font-heading text-3xl leading-tight font-extrabold tabular-nums [overflow-wrap:anywhere]">
          {formatCurrency(remainingAmount, { signDisplay: "never" })}
        </p>
        <Progress value={paymentProgress} tone={collecting ? "leaf" : "coral"} />
        <p className="text-xs text-muted-foreground">
          {paidLabel} {formatCurrency(paidAmount, { signDisplay: "never" })} / {formatCurrency(totalAmount, { signDisplay: "never" })} · {Math.round(paymentProgress)}%
        </p>
      </div>

      <SettingsGroup
        footer={debt.hasInterest
          ? `Lãi đơn trên gốc ban đầu, ${debt.interestPeriod === "year" ? "365 ngày/năm" : "30 ngày/tháng"}, tính đến ${formatDebtDate(interestDate)}. Dừng tính lãi khi tất toán.`
          : undefined}
      >
        <SettingsRow title="Tiền gốc" value={formatCurrency(debt.amount, { signDisplay: "never" })} />
        <SettingsRow
          title="Lãi suất"
          value={debt.hasInterest ? `${debt.interestRate ?? 0}%/${debt.interestPeriod === "year" ? "năm" : "tháng"}` : "Không tính lãi"}
        />
        {debt.hasInterest ? (
          <>
            <SettingsRow title={`Tiền lãi · ${days} ngày`} value={formatCurrency(interestAmount)} />
            <SettingsRow title="Tổng gốc và lãi" value={formatCurrency(totalAmount)} />
          </>
        ) : null}
        <SettingsRow title={paidLabel} value={formatCurrency(paidAmount, { signDisplay: "never" })} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          title={debt.recordingMode === "opening" ? "Ngày bắt đầu theo dõi" : "Ngày ghi"}
          value={formatDebtDate(debt.recordedAt)}
        />
        <SettingsRow
          title="Hẹn trả"
          description={debt.dueAt && debt.status !== "settled" ? deadline.label : undefined}
          value={debt.dueAt ? formatDebtDate(debt.dueAt) : "Không có"}
        />
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
              Xoá “{debt.note}” cùng toàn bộ {debt.payments?.length ?? 0} lần thu/trả.
              {debt.recordingMode === "opening" ? " Chỉ hoàn tác tác động số dư của các lần thu/trả đã ghi nhận; tiền gốc không ảnh hưởng số dư." : " Xoá giao dịch ban đầu và điều chỉnh số dư các tài khoản như chưa từng có khoản nợ này."}
              {" "}Sau khi xác nhận, bạn có 6 giây để hoàn tác.
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
    </>
  )
}
