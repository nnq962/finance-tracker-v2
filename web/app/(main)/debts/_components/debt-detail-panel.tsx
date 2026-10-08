"use client"

import * as React from "react"
import { CheckIcon, PencilIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Money } from "@/components/app/money"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatShortDate } from "@/lib/format-date"
import { cn } from "@/lib/utils"

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

/** Side panel beside the list (xl and up), its person and the edit button over it; below xl the same content opens in a sheet. */
export function DebtDetailPanel(props: DebtDetailPanelProps) {
  return (
    <section aria-labelledby="debt-detail-title" className="space-y-2">
      {/* A caption like the summary's beside it, so both columns start on one line. */}
      <div className="flex min-h-6 items-center justify-between gap-3 px-3">
        <h2 id="debt-detail-title" className={cn("truncate", groupCaptionClassName)}>
          {props.contact.name}
        </h2>
        <DebtEditButton {...props} variant="text" />
      </div>
      <div className="space-y-6">
        <DebtDetailInfo {...props} />
        {getDebtMetrics(props.debt).remainingAmount > 0 && props.debt.status !== "settled" ? (
          <DebtRecordPaymentButton {...props} />
        ) : null}
      </div>
    </section>
  )
}

/**
 * Edits the debt: a round pencil for a sheet's bar, or a small text button
 * beside the side panel's caption.
 */
export function DebtEditButton({
  variant,
  accounts,
  contacts,
  debt,
  onChangeDebt,
}: DebtDetailPanelProps & { variant: "icon" | "text" }) {
  const [editing, setEditing] = React.useState(false)

  return (
    <>
      {variant === "icon" ? (
        <Button type="button" variant="secondary" size="icon" aria-label="Sửa khoản nợ" onClick={() => setEditing(true)}>
          <PencilIcon />
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="sm" className="-my-2" onClick={() => setEditing(true)}>
          <PencilIcon />
          Sửa
        </Button>
      )}
      <AddDebtSheet
        debt={debt}
        contacts={contacts}
        accounts={accounts}
        onAddDebt={onChangeDebt}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  )
}

/** "còn 11 ngày", "quá 6 ngày": a deadline label inside a sentence. */
function lowerFirst(text: string) {
  return text.charAt(0).toLocaleLowerCase("vi-VN") + text.slice(1)
}

/**
 * A debt as a receipt, as a transaction's and an account's sheets show
 * theirs: the person, which way, what is left in large and when it is due;
 * how much is paid; the interest, when it has some, as one group; where its
 * money came from or went, when, and the note; every collection or
 * repayment (tap to edit, swipe to delete); then deleting it, with an undo.
 * Shared by the side panel and the sheet.
 */
export function DebtDetailInfo(props: DebtDetailPanelProps) {
  const { contact, debt, accounts, onEditPayment, onDeletePayment, onChangeDebt } = props
  const { paidAmount, remainingAmount, paymentProgress, interestAmount, interestDate, totalAmount, days } = getDebtMetrics(debt)
  const deadline = getDebtDeadline(debt)
  const collecting = debt.direction === "lent"
  const way = collecting ? "Cho vay" : "Đi vay"
  const settled = debt.status === "settled" || remainingAmount <= 0
  const projection = getDueProjection(debt, paidAmount)
  const account = accounts.find((item) => item.id === debt.accountId)
  const period = debt.interestPeriod === "year" ? "năm" : "tháng"
  const perPeriod = Math.round((debt.amount * (debt.interestRate ?? 0)) / 100)

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-2 text-center">
        <ContactAvatar contactId={contact.id} initials={contact.initials} size="lg" />
        <p className="mt-3 text-base text-muted-foreground">
          {way} · {contact.name}
        </p>
        <Money amount={settled ? totalAmount : remainingAmount} sign="never" size="xl" tone={settled ? "muted" : "default"} />
        <p className={cn("mt-1 text-sm text-muted-foreground", !settled && deadline.isOverdue && "text-expense")}>
          {settled
            ? "Đã tất toán"
            : [
                `${collecting ? "Còn phải thu" : "Còn phải trả"}${debt.hasInterest ? " hôm nay" : ""}`,
                debt.dueAt ? `hẹn ${formatShortDate(debt.dueAt)}, ${lowerFirst(deadline.label)}` : "không hạn trả",
              ].join(" · ")}
        </p>
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
              description={collecting ? "Còn phải thu khi đó" : "Còn phải trả khi đó"}
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

      <SettingsGroup>
        <SettingsRow destructive title="Xoá khoản nợ" onClick={() => void onChangeDebt(null)} />
      </SettingsGroup>
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
