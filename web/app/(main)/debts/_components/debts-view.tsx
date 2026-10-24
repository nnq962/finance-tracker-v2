"use client"

import * as React from "react"
import {
  CircleCheckIcon,
  HandshakeIcon,
} from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { ShelfLink } from "@/components/app/shelf-link"
import { SettingsGroup } from "@/components/settings-list"
import { Card } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import {
  compareDebtsByUrgency,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt, DebtDirection, NewDebt, NewDebtPayment } from "../_types/debt"
import {
  DebtDetailInfo,
  DebtEditButton,
  DebtRecordPaymentButton,
} from "./debt-detail-panel"
import { getDebtSummary } from "../_lib/get-debt-summary"
import { DebtBalance } from "./debt-balance"
import { DebtListItem } from "./debt-list-item"

type DebtsViewProps = {
  /** A debt to show, asked from outside the list (the contacts); a new `key` asks again for the same one. */
  openRequest?: { debtId: string; key: number }
  /** The debt a link to the page names (`/transactions?view=debts&debt=…`, from a transaction, the overview or a notice): its sheet opens. */
  requestedDebtId?: string
  onChangeDebt: (id: string, values: NewDebt | null) => Promise<void>
  accounts: Account[]
  onEditPayment: (debtId: string, paymentId: string, values: NewDebtPayment) => Promise<void>
  onDeletePayment: (debtId: string, paymentId: string) => Promise<void>
  contacts: Contact[]
  debts: Debt[]
  onRecordPayment: (debtId: string, payment: NewDebtPayment) => Promise<void>
  /** The empty page's button: a new debt. */
  emptyAction?: React.ReactNode
}

function isSettled(debt: Debt) {
  return debt.status === "settled" || getDebtMetrics(debt).remainingAmount <= 0
}

/** Past due or due today: the debts to see to first, in their own group. */
function needsAttention(debt: Debt) {
  return getDebtDeadline(debt).isOverdue
}

export function DebtsView({
  openRequest,
  requestedDebtId,
  onChangeDebt,
  contacts,
  debts,
  onRecordPayment,
  accounts,
  onEditPayment,
  onDeletePayment,
  emptyAction,
}: DebtsViewProps) {
  const [sheetDebtId, setSheetDebtId] = React.useState<string | null>(null)
  // The settled debts, listed in a sheet of their own.
  const [settledOpen, setSettledOpen] = React.useState(false)
  // A link from elsewhere opens its debt when the URL comes to name it. A tap
  // on a row leaves the URL alone: every debt came with its payments, so the
  // sheet opens at once, with no page to load (2026-10-17).
  const [seenRequest, setSeenRequest] = React.useState<string>()
  if (requestedDebtId !== seenRequest) {
    setSeenRequest(requestedDebtId)
    if (requestedDebtId) setSheetDebtId(requestedDebtId)
  }
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))
  const openDebts = debts.filter((debt) => !isSettled(debt)).sort(compareDebtsByUrgency)
  const settledDebts = debts
    .filter(isSettled)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
  const summary = getDebtSummary(debts)
  const openCount = (side: DebtDirection) => openDebts.filter((debt) => debt.direction === side).length
  const tiles = (
    <DebtBalance
      lent={summary.totalLent}
      borrowed={summary.totalBorrowed}
      lentCount={openCount("lent")}
      borrowedCount={openCount("borrowed")}
    />
  )
  // A deleted debt closes the sheet. The last debt stays on screen while it slides closed.
  const sheetDebt = sheetDebtId ? debts.find((debt) => debt.id === sheetDebtId) : undefined
  const [shownDebt, setShownDebt] = React.useState(sheetDebt)
  if (sheetDebt && sheetDebt !== shownDebt) setShownDebt(sheetDebt)
  const shownContact = shownDebt ? contactById.get(shownDebt.contactId) : undefined

  function selectDebt(debtId: string) {
    setSheetDebtId(debtId)
  }

  // Shown as a tap on its row would: in its sheet.
  const selectDebtRef = React.useRef(selectDebt)
  React.useEffect(() => {
    selectDebtRef.current = selectDebt
  })
  React.useEffect(() => {
    if (openRequest) selectDebtRef.current(openRequest.debtId)
  }, [openRequest])

  function getDetailProps(debt: Debt, contact: Contact) {
    return {
      accounts,
      contacts,
      contact,
      debt,
      onChangeDebt: async (values: NewDebt | null) => {
        await onChangeDebt(debt.id, values)
        // A deleted debt leaves its sheet; the toast can still undo it.
        if (values === null) setSheetDebtId(null)
      },
      onEditPayment: (paymentId: string, values: NewDebtPayment) =>
        onEditPayment(debt.id, paymentId, values),
      onDeletePayment: (paymentId: string) => onDeletePayment(debt.id, paymentId),
      onRecordPayment: (payment: NewDebtPayment) => onRecordPayment(debt.id, payment),
    }
  }

  function renderRows(items: Debt[]) {
    return items.map((debt) => {
      const contact = contactById.get(debt.contactId)
      if (!contact) return null

      return (
        <DebtListItem
          key={debt.id}
          contact={contact}
          debt={debt}
          active={false}
          onSelect={() => selectDebt(debt.id)}
        />
      )
    })
  }

  // The open debt's sheet: inside the list's sheet when opened from it.
  const detailSheet = (
        <PageSheet
          title="Chi tiết khoản nợ"
          action={
            shownDebt && shownContact ? (
              <DebtEditButton {...getDetailProps(shownDebt, shownContact)} />
            ) : undefined
          }
          open={sheetDebt !== undefined}
          onOpenChange={(open) => {
            if (!open) setSheetDebtId(null)
          }}
        >
          {shownDebt && shownContact ? (
            <React.Fragment key={shownDebt.id}>
              <div className="pb-4">
                <DebtDetailInfo {...getDetailProps(shownDebt, shownContact)} />
              </div>
              {/* Nothing left to collect or repay once settled. */}
              {isSettled(shownDebt) ? null : (
                <PageSheetFooter>
                  <DebtRecordPaymentButton {...getDetailProps(shownDebt, shownContact)} />
                </PageSheetFooter>
              )}
            </React.Fragment>
          ) : null}
        </PageSheet>
  )

  if (debts.length === 0) {
    return (
      <div className="space-y-6 md:space-y-8">
        {tiles}
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HandshakeIcon />
              </EmptyMedia>
              <EmptyTitle>Chưa có khoản nợ</EmptyTitle>
              <EmptyDescription>Khoản cho vay và đi vay hiện ở đây, kèm hạn trả.</EmptyDescription>
            </EmptyHeader>
            {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
          </Empty>
        </Card>
      </div>
    )
  }

  // Two groups (2026-10-24, the Claude Design handoff; Cần thu | Cần trả before):
  // what is past due or due today first, then the rest, each by the nearest due date.
  const groups = [
    { label: "Cần chú ý", items: openDebts.filter(needsAttention) },
    { label: "Đang mở", items: openDebts.filter((debt) => !needsAttention(debt)) },
  ].filter((group) => group.items.length > 0)

  return (
    <div className="space-y-6 md:space-y-8">
      {tiles}

      {/* The totals are on the card above. Each group a card of rows; from lg up the
          two stand side by side. A long note is cut, not widening the page. */}
      <div className="grid grid-cols-1 items-start gap-6 md:gap-8 lg:grid-cols-2">
        {groups.map(({ label, items }) => (
          <SettingsGroup key={label} title={`${label} · ${items.length}`}>
            {renderRows(items)}
          </SettingsGroup>
        ))}
      </div>

      {/* Settled debts are not folded into the page: one quiet line opens them in a sheet, as the accounts page's Lưu trữ. */}
      {settledDebts.length > 0 ? (
        <ShelfLink icon={CircleCheckIcon} onClick={() => setSettledOpen(true)}>
          {settledDebts.length} khoản đã tất toán
        </ShelfLink>
      ) : null}

      <PageSheet
        title="Đã tất toán"
        open={settledOpen}
        onOpenChange={setSettledOpen}
      >
        {/* A card of rows, as every list in a sheet (2026-10-25; flat on the sheet before). */}
        <SettingsGroup title={`${settledDebts.length} khoản`}>
          {renderRows(settledDebts)}
        </SettingsGroup>
        {/* A debt opened from the list is pushed into this sheet, ‹ back to it. */}
        {settledOpen ? detailSheet : null}
      </PageSheet>

      {settledOpen ? null : detailSheet}
    </div>
  )
}
