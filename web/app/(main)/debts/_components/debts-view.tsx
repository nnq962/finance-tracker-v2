"use client"

import * as React from "react"
import {
  HandshakeIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

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
  DebtDetailSkeleton,
  DebtEditButton,
  DebtRecordPaymentButton,
} from "./debt-detail-panel"
import { getDebtSummary } from "../_lib/get-debt-summary"
import { DebtBalance } from "./debt-balance"
import { DebtListItem } from "./debt-list-item"

type DebtsViewProps = {
  /** A debt to show, asked from outside the list (the contacts); a new `key` asks again for the same one. */
  openRequest?: { debtId: string; key: number }
  onChangeDebt: (id: string, values: NewDebt | null) => Promise<void>
  initialSelectedDebtId?: string
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
  onChangeDebt,
  contacts,
  initialSelectedDebtId,
  debts,
  onRecordPayment,
  accounts,
  onEditPayment,
  onDeletePayment,
}: DebtsViewProps) {
  const router = useRouter()
  const [, startNavigation] = React.useTransition()
  const [sheetDebtId, setSheetDebtId] = React.useState<string | null>(null)
  const selectedDebtId = initialSelectedDebtId ?? debts[0]?.id
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))
  const openDebts = debts.filter((debt) => !isSettled(debt)).sort(compareDebtsByUrgency)
  const settledDebts = debts
    .filter(isSettled)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
  const overdueDebts = openDebts.filter((debt) => getDebtDeadline(debt).isOverdue)
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
  // Payments are only loaded for the selected debt, so the sheet waits for
  // the navigation that selects it. A deleted debt closes the sheet.
  const sheetDebt = sheetDebtId ? debts.find((debt) => debt.id === sheetDebtId) : undefined
  const sheetContact = sheetDebt ? contactById.get(sheetDebt.contactId) : undefined
  const isSheetReady = sheetDebt !== undefined && sheetDebt.id === selectedDebtId

  function selectDebt(debtId: string) {
    setSheetDebtId(debtId)

    if (debtId === selectedDebtId) return

    startNavigation(() =>
      router.replace(`/debts?debt=${encodeURIComponent(debtId)}`, {
        scroll: false,
      }),
    )
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
            title={`${overdueDebts.length} khoản quá hạn`}
            // Opens the one overdue the longest; the rest sit at the top of their sections.
            onClick={() => selectDebt(overdueDebts[0].id)}
          >
            {[...new Set(overdueDebts.map((debt) => contactById.get(debt.contactId)?.name))].filter(Boolean).join(", ")}
          </NoticeBanner>
        ) : null}

      {/* The totals are on the card above. Stacked on phones; from lg up the
          two sides stand side by side, Cần thu | Cần trả, an empty side kept
          with a line so the other stays in its column. */}
      <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-2">
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
          isSheetReady && sheetDebt && sheetContact ? (
            <DebtEditButton {...getDetailProps(sheetDebt, sheetContact)} />
          ) : undefined
        }
        open={sheetDebt !== undefined}
        onOpenChange={(open) => {
          if (!open) setSheetDebtId(null)
        }}
      >
        {isSheetReady && sheetDebt && sheetContact ? (
          <React.Fragment key={sheetDebt.id}>
            <div className="pb-4">
              <DebtDetailInfo {...getDetailProps(sheetDebt, sheetContact)} />
            </div>
            {/* Nothing left to collect or repay once settled. */}
            {isSettled(sheetDebt) ? null : (
              <PageSheetFooter>
                <DebtRecordPaymentButton {...getDetailProps(sheetDebt, sheetContact)} />
              </PageSheetFooter>
            )}
          </React.Fragment>
        ) : (
          <div
            className="space-y-6 pb-4"
            role="status"
            aria-label="Đang tải chi tiết khoản nợ"
          >
            <DebtDetailSkeleton />
          </div>
        )}
      </PageSheet>
    </div>
  )
}
