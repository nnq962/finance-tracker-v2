"use client"

import * as React from "react"
import {
  HandshakeIcon,
  TriangleAlertIcon,
} from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import {
  Empty,
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
  /** The debt a link to the page names (`/debts?debt=…`, from a transaction, the overview or a notice): its sheet opens. */
  requestedDebtId?: string
  onChangeDebt: (id: string, values: NewDebt | null) => Promise<void>
  accounts: Account[]
  onEditPayment: (debtId: string, paymentId: string, values: NewDebtPayment) => Promise<void>
  onDeletePayment: (debtId: string, paymentId: string) => Promise<void>
  contacts: Contact[]
  debts: Debt[]
  onRecordPayment: (debtId: string, payment: NewDebtPayment) => Promise<void>
}

function isSettled(debt: Debt) {
  return debt.status === "settled" || getDebtMetrics(debt).remainingAmount <= 0
}

const sections: Array<{ direction: DebtDirection; label: string }> = [
  { direction: "lent", label: "Cần thu" },
  { direction: "borrowed", label: "Cần trả" },
]

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
}: DebtsViewProps) {
  const [sheetDebtId, setSheetDebtId] = React.useState<string | null>(null)
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
  // Overdue first (the list's order), then those due today; the banner counts each apart.
  const overdueDebts = openDebts.filter((debt) => getDebtDeadline(debt).isOverdue)
  const pastDueCount = overdueDebts.filter((debt) => getDebtDeadline(debt).isPastDue).length
  const dueTodayCount = overdueDebts.length - pastDueCount
  const overdueTitle = [
    // Both: one short line on a phone ("2 quá hạn · 1 đến hạn hôm nay").
    pastDueCount > 0 ? `${pastDueCount}${dueTodayCount > 0 ? "" : " khoản"} quá hạn` : null,
    dueTodayCount > 0 ? `${dueTodayCount}${pastDueCount > 0 ? "" : " khoản"} đến hạn hôm nay` : null,
  ].filter(Boolean).join(" · ")
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

  if (debts.length === 0) {
    return (
      <div className="space-y-6 md:space-y-8">
        {tiles}
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HandshakeIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có khoản nợ</EmptyTitle>
            <EmptyDescription>Khoản cho vay và đi vay hiện ở đây, kèm hạn trả.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {tiles}

        {overdueDebts.length > 0 ? (
          <NoticeBanner
            // A white card among the lists, red as the overdue rows' "Quá N ngày".
            tone="expense"
            surface="card"
            icon={TriangleAlertIcon}
            title={overdueTitle}
            // Opens the one overdue the longest; the rest sit at the top of their sections.
            onClick={() => selectDebt(overdueDebts[0].id)}
          >
            {[...new Set(overdueDebts.map((debt) => contactById.get(debt.contactId)?.name))].filter(Boolean).join(", ")}
          </NoticeBanner>
        ) : null}

      {/* The totals are on the card above. Stacked on phones; from lg up the
          two sides stand side by side, Cần thu | Cần trả, an empty side kept
          with a line so the other stays in its column. One column on phones,
          as wide as the page: a long note is cut, not widening it (2026-10-17). */}
      <div className="grid grid-cols-1 items-start gap-6 md:gap-8 lg:grid-cols-2">
        {sections.map(({ direction: side, label }) => {
          const items = openDebts.filter((debt) => debt.direction === side)
          if (items.length === 0) {
            return (
              <div key={side} className="hidden lg:block">
                <SettingsGroup title={`${label} · 0`}>
                  <SettingsRow title="Không có khoản nào" />
                </SettingsGroup>
              </div>
            )
          }

          return (
            <SettingsGroup key={side} title={`${label} · ${items.length}`}>
              {renderRows(items)}
            </SettingsGroup>
          )
        })}
      </div>

        {settledDebts.length > 0 ? (
          <SettingsGroup
            title="Đã tất toán"
            collapsible={{ showLabel: `Hiện ${settledDebts.length} khoản`, defaultOpen: openDebts.length === 0 }}
          >
            {renderRows(settledDebts)}
          </SettingsGroup>
        ) : null}

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
    </div>
  )
}
