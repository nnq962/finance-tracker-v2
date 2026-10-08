"use client"

import { ArrowDownLeftIcon, ArrowUpRightIcon, HistoryIcon } from "lucide-react"

import { Money } from "@/components/app/money"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import { formatShortDate } from "@/lib/format-date"

import { getOpeningPaidAmount } from "../_lib/debt-payments"
import type { Contact, Debt, DebtPayment, NewDebtPayment } from "../_types/debt"
import { RecordDebtPaymentSheet } from "./record-debt-payment-sheet"

type Props = {
  debt: Debt
  contact: Contact
  accounts: Account[]
  onEdit: (id: string, values: NewDebtPayment) => Promise<void>
  /** Deletes with an undo. */
  onDelete: (id: string) => Promise<void>
}

/** One collection or repayment: tapped it opens to edit (and delete there), swiped left it is deleted. */
function PaymentEntry({ payment, debt, contact, accounts, onEdit, onDelete }: Props & { payment: DebtPayment }) {
  const collecting = debt.direction === "lent"

  return (
    <RecordDebtPaymentSheet
      contact={contact}
      debt={debt}
      accounts={accounts}
      payment={payment}
      onRecordPayment={(values) => onEdit(payment.id, values)}
      onDelete={() => void onDelete(payment.id)}
      trigger={(openSheet) => (
        <SettingsRow
          icon={collecting ? ArrowDownLeftIcon : ArrowUpRightIcon}
          tone={collecting ? "income" : "expense"}
          title={
            <>
              <span className="sr-only">{collecting ? "Đã thu " : "Đã trả "}</span>
              <Money amount={collecting ? payment.amount : -payment.amount} sign="always" size="sm" tone={collecting ? "income" : "default"} />
            </>
          }
          description={[
            [formatShortDate(payment.paidAt), payment.paidTime?.slice(0, 5)].filter(Boolean).join(", "),
            payment.accountName,
          ].filter(Boolean).join(" · ")}
          onClick={openSheet}
          swipeAction={{ label: "Xoá", onAction: () => void onDelete(payment.id) }}
        />
      )}
    />
  )
}

/**
 * Every collection or repayment of a debt, newest first, then what was paid
 * before it was recorded here, as one row with no date.
 */
export function DebtPaymentHistory(props: Props) {
  const { debt } = props
  const opening = getOpeningPaidAmount(debt)
  const payments = [...(debt.payments ?? [])].sort((a, b) => `${b.paidAt}T${b.paidTime ?? "00:00"}`.localeCompare(`${a.paidAt}T${a.paidTime ?? "00:00"}`))
  const collecting = debt.direction === "lent"
  const count = payments.length + (opening > 0 ? 1 : 0)

  return (
    <SettingsGroup
      title={`Lịch sử ${collecting ? "thu" : "trả"}${count > 0 ? ` · ${count}` : ""}`}
      // The side panel (xl) is used with a mouse: no swiping there, delete is inside.
      footer={payments.length > 0 ? <>Chạm để sửa<span className="xl:hidden">, vuốt trái để xoá</span>.</> : undefined}
    >
      {payments.map((payment) => <PaymentEntry key={payment.id} {...props} payment={payment} />)}
      {opening > 0 ? (
        <SettingsRow
          icon={HistoryIcon}
          title={<Money amount={collecting ? opening : -opening} sign="always" size="sm" tone={collecting ? "income" : "default"} />}
          description="Trước đây, chưa có ngày"
        />
      ) : null}
      {count === 0 ? <SettingsRow title={collecting ? "Chưa thu lần nào" : "Chưa trả lần nào"} /> : null}
    </SettingsGroup>
  )
}
