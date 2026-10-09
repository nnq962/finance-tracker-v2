"use client"

import * as React from "react"
import { CheckIcon, PencilIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsGroupSkeleton, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatShortDate } from "@/lib/format-date"

import { getDueProjection, todayDate } from "../_lib/debt-payments"
import { formatDebtDate, getDebtDeadline, getDebtMetrics } from "../_lib/debt-presentation"
import type { Contact, Debt, NewDebt, NewDebtPayment } from "../_types/debt"
import { AddDebtSheet } from "./add-debt-sheet"
import { ContactAvatar } from "./contact-avatar"
import { DebtPaymentHistory } from "./debt-payment-history"
import { RecordDebtPaymentSheet } from "./record-debt-payment-sheet"

type DebtDetailPanelProps = {
  contacts: Contact[]
  /** Saves the debt edited, or deletes it (`null`, with an undo). */
  onChangeDebt: (values: NewDebt | null) => Promise<void>
  accounts: Account[]
  onEditPayment: (id: string, values: NewDebtPayment) => Promise<void>
  onDeletePayment: (id: string) => Promise<void>
  contact: Contact
  debt: Debt
  onRecordPayment: (payment: NewDebtPayment) => Promise<void>
}

/**
 * Edits the debt: a round pencil for the sheet's bar.
 */
export function DebtEditButton({
  accounts,
  contacts,
  debt,
  onChangeDebt,
}: DebtDetailPanelProps) {
  const [editing, setEditing] = React.useState(false)

  return (
    <>
      <Button type="button" variant="secondary" size="icon" aria-label="Sửa khoản nợ" onClick={() => setEditing(true)}>
        <PencilIcon />
      </Button>
      <AddDebtSheet
        debt={debt}
        contacts={contacts}
        accounts={accounts}
        onAddDebt={onChangeDebt}
        // Deleting is in the edit sheet, beside saving, not at the end of the details by their action.
        onDelete={() => {
          setEditing(false)
          void onChangeDebt(null)
        }}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  )
}

/**
 * Same footprint as DebtDetailInfo while a debt loads: the round avatar, who
 * owes whom, the amount and its badge, the paid card, then rows of a title
 * and a value and the history.
 */
export function DebtDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="flex flex-col items-center pt-2">
        <Skeleton className="size-12 rounded-full" />
        <div className="mt-3 flex h-6 items-center">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex h-[42.5px] items-center">
          <Skeleton className="h-8 w-44" />
        </div>
        <Skeleton className="mt-2 h-6 w-24 rounded-full" />
      </div>
      <Card className="gap-2 px-4 py-4">
        <Skeleton className="h-2 rounded-full" />
        <div className="flex h-4 items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>
      </Card>
      <SettingsGroupSkeleton caption={false} rows={3} media="none" trailing="value" />
      <SettingsGroupSkeleton rows={1} description />
    </div>
  )
}

/** Where a debt stands, for the badge under its amount: "Còn 11 ngày", "Quá hạn 6 ngày", "Đến hạn hôm nay", "Không hạn trả", "Đã tất toán". */
function standingLabel(debt: Debt, settled: boolean) {
  if (settled) return "Đã tất toán"
  if (!debt.dueAt) return "Không hạn trả"
  return getDebtDeadline(debt).label
}

/**
 * A debt as a receipt, as a transaction's and an account's sheets show
 * theirs: who owes whom, what is left in large (with the interest in it) and
 * a badge for where it stands (days left, overdue, settled);
 * how much is paid; the interest, when it has some, as one group; where its
 * money came from or went, when, and the note; every collection or
 * repayment (tap to edit, swipe to delete). Deleting the debt is in its edit
 * sheet, beside saving.
 * Shared by the side panel and the sheet.
 */
export function DebtDetailInfo(props: DebtDetailPanelProps) {
  const { contact, debt, accounts, onEditPayment, onDeletePayment } = props
  const { paidAmount, remainingAmount, paymentProgress, interestAmount, interestDate, totalAmount, days } = getDebtMetrics(debt)
  const deadline = getDebtDeadline(debt)
  const collecting = debt.direction === "lent"
  const settled = debt.status === "settled" || remainingAmount <= 0
  const projection = getDueProjection(debt, paidAmount)
  const account = accounts.find((item) => item.id === debt.accountId)
  const period = debt.interestPeriod === "year" ? "năm" : "tháng"
  const perPeriod = Math.round((debt.amount * (debt.interestRate ?? 0)) / 100)

  return (
    <div className="space-y-6">
      {/* Who owes whom, how much, and where it stands; the dates are in the rows below. */}
      <div className="flex flex-col items-center pt-2 text-center">
        <ContactAvatar contactId={contact.id} initials={contact.initials} size="lg" />
        <p className="mt-3 text-base text-muted-foreground">
          {collecting ? `${contact.name} nợ bạn` : `Bạn nợ ${contact.name}`}
        </p>
        <Money amount={settled ? totalAmount : remainingAmount} sign="never" size="xl" tone={settled ? "muted" : "default"} />
        {!settled && debt.hasInterest && interestAmount > 0 ? (
          <p className="text-xs text-muted-foreground">
            Gồm {formatCurrency(interestAmount, { signDisplay: "never" })} lãi tính đến{" "}
            {interestDate === todayDate() ? "hôm nay" : formatDebtDate(interestDate)}
          </p>
        ) : null}
        <Badge className="mt-2" variant={settled ? "income" : deadline.isOverdue ? "expense" : "secondary"}>
          {standingLabel(debt, settled)}
        </Badge>
      </div>

      {/* How much of it is paid. */}
      <Card className="gap-2 px-4 py-4">
        <Progress value={paymentProgress} aria-label={`${collecting ? "Đã thu" : "Đã trả"} ${Math.round(paymentProgress)}%`} />
        <div className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {collecting ? "Đã thu" : "Đã trả"}{" "}
            <span className="font-medium text-foreground tabular-nums">{formatCurrency(paidAmount, { signDisplay: "never" })}</span>
          </span>
          <span className="tabular-nums">
            {Math.round(paymentProgress)}% của {formatCurrency(totalAmount, { signDisplay: "never" })}
          </span>
        </div>
      </Card>

      {debt.hasInterest ? (
        <SettingsGroup title={`Lãi ${debt.interestRate ?? 0}%/${period}`} footer="Lãi đơn trên tiền gốc, cộng dồn theo ngày.">
          <SettingsRow title="Tiền gốc" value={formatCurrency(debt.amount, { signDisplay: "never" })} />
          <SettingsRow
            title={`Lãi đến ${interestDate === todayDate() ? "hôm nay" : formatDebtDate(interestDate)}`}
            description={`${days} ngày · ${formatCurrency(perPeriod)} mỗi ${period}`}
            value={`+${formatCurrency(interestAmount, { signDisplay: "never" })}`}
          />
          <SettingsRow
            title="Tổng gốc và lãi"
            value={<span className="font-medium text-foreground">{formatCurrency(totalAmount, { signDisplay: "never" })}</span>}
          />
          {projection ? (
            // What it comes to on the due date, as interest keeps accruing until then.
            <SettingsRow
              title={`Đến hạn ${formatShortDate(projection.dueAt)}`}
              description="Gốc và lãi còn lại vào ngày đó"
              value={formatCurrency(projection.remainingAmount, { signDisplay: "never" })}
            />
          ) : null}
        </SettingsGroup>
      ) : null}

      <SettingsGroup>
        {debt.recordingMode === "opening" ? (
          // Recorded as owed already: no account's balance moved.
          <SettingsRow title="Nợ có sẵn" value="Không đổi số dư" />
        ) : (
          <SettingsRow
            title={collecting ? "Tiền ra từ" : "Tiền vào"}
            value={
              <span className="flex min-w-0 items-center gap-2">
                {account ? <AccountLogo account={account} size="xs" /> : null}
                <span className="min-w-0 truncate">{account?.name ?? "Không xác định"}</span>
              </span>
            }
          />
        )}
        <SettingsRow
          title={debt.recordingMode === "opening" ? "Bắt đầu theo dõi" : collecting ? "Ngày cho vay" : "Ngày vay"}
          value={formatDebtDate(debt.recordedAt)}
        />
        {debt.dueAt ? <SettingsRow title="Hẹn trả" value={formatDebtDate(debt.dueAt)} /> : null}
        {debt.note ? <SettingsRow title="Ghi chú" description={<span className="select-text">{debt.note}</span>} fullDescription /> : null}
      </SettingsGroup>

      <DebtPaymentHistory debt={debt} contact={contact} accounts={accounts} onEdit={onEditPayment} onDelete={onDeletePayment} />

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
