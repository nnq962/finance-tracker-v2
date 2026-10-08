"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  HandCoinsIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import type { Account } from "@/lib/accounts/types"
import { FlowTiles } from "@/components/app/flow-tiles"
import { NoticeBanner } from "@/components/app/notice-banner"
import { SettingsGroup } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

import {
  compareDebtsByUrgency,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import type { Contact, Debt, DebtDirection, NewDebt, NewDebtPayment } from "../_types/debt"
import {
  DebtDetailInfo,
  DebtDetailPanel,
  DebtRecordPaymentButton,
} from "./debt-detail-panel"
import { getDebtSummary } from "../_lib/get-debt-summary"
import { DebtListItem } from "./debt-list-item"

// Matches Tailwind's `xl`, where the detail panel sits beside the list.
const SIDE_PANEL_QUERY = "(min-width: 80rem)"

function subscribeSidePanel(onChange: () => void) {
  const query = window.matchMedia(SIDE_PANEL_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useHasSidePanel() {
  return React.useSyncExternalStore(
    subscribeSidePanel,
    () => window.matchMedia(SIDE_PANEL_QUERY).matches,
    () => false,
  )
}

type DebtsViewProps = {
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
  const hasSidePanel = useHasSidePanel()
  const selectedDebtId = initialSelectedDebtId ?? debts[0]?.id
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))
  const openDebts = debts.filter((debt) => !isSettled(debt)).sort(compareDebtsByUrgency)
  const settledDebts = debts
    .filter(isSettled)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
  // A tile chosen shows only that side, its overdue and settled loans included.
  const [direction, setDirection] = React.useState<DebtDirection | null>(null)
  const shown = (items: Debt[]) => (direction ? items.filter((debt) => debt.direction === direction) : items)
  const overdueDebts = shown(openDebts).filter((debt) => getDebtDeadline(debt).isOverdue)
  const summary = getDebtSummary(debts)
  const openCount = (side: DebtDirection) => openDebts.filter((debt) => debt.direction === side).length
  const tiles = (
    <FlowTiles
      value={direction}
      onValueChange={setDirection}
      tiles={[
        {
          value: "lent",
          label: "Cần thu",
          amount: summary.totalLent,
          caption: `${openCount("lent")} khoản`,
          icon: ArrowDownLeftIcon,
          tone: "income",
        },
        {
          value: "borrowed",
          label: "Cần trả",
          amount: summary.totalBorrowed,
          caption: `${openCount("borrowed")} khoản`,
          icon: ArrowUpRightIcon,
          tone: "expense",
        },
      ]}
    />
  )
  const selectedDebt = debts.find((debt) => debt.id === selectedDebtId)
  const selectedContact = selectedDebt
    ? contactById.get(selectedDebt.contactId)
    : undefined
  // Payments are only loaded for the selected debt, so the sheet waits for
  // the navigation that selects it. A deleted debt closes the sheet.
  const sheetDebt = sheetDebtId ? debts.find((debt) => debt.id === sheetDebtId) : undefined
  const sheetContact = sheetDebt ? contactById.get(sheetDebt.contactId) : undefined
  const isSheetReady = sheetDebt !== undefined && sheetDebt.id === selectedDebtId

  function selectDebt(debtId: string) {
    if (!window.matchMedia(SIDE_PANEL_QUERY).matches) {
      setSheetDebtId(debtId)
    }

    if (debtId === selectedDebtId) return

    startNavigation(() =>
      router.replace(`/debts?debt=${encodeURIComponent(debtId)}`, {
        scroll: false,
      }),
    )
  }

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
          active={hasSidePanel && debt.id === selectedDebt?.id}
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
              <HandCoinsIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có khoản nợ</EmptyTitle>
            <EmptyDescription>Khoản cho vay và đi vay hiện ở đây, kèm hạn trả.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-6 md:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-6 md:space-y-8">
        {tiles}

        {overdueDebts.length > 0 ? (
          <NoticeBanner
            tone="warning"
            icon={TriangleAlertIcon}
            title={`${overdueDebts.length} khoản quá hạn`}
            // Opens the one overdue the longest; the rest sit at the top of their sections.
            onClick={() => selectDebt(overdueDebts[0].id)}
          >
            {[...new Set(overdueDebts.map((debt) => contactById.get(debt.contactId)?.name))].filter(Boolean).join(", ")}
          </NoticeBanner>
        ) : null}

        {/* The totals are on the tiles above. */}
        {sections.map(({ direction: side, label }) => {
          const items = shown(openDebts).filter((debt) => debt.direction === side)
          if (items.length === 0) return null

          return (
            <SettingsGroup key={side} title={`${label} · ${items.length}`}>
              {renderRows(items)}
            </SettingsGroup>
          )
        })}

        {shown(settledDebts).length > 0 ? (
          <SettingsGroup
            title="Đã tất toán"
            collapsible={{ showLabel: `Hiện ${shown(settledDebts).length} khoản`, defaultOpen: openDebts.length === 0 }}
          >
            {renderRows(shown(settledDebts))}
          </SettingsGroup>
        ) : null}

      </div>

      {/* Full height, scrolling with the page rather than on its own. */}
      <div className="hidden xl:block">
        {selectedDebt && selectedContact ? (
          <DebtDetailPanel
            key={selectedDebt.id}
            {...getDetailProps(selectedDebt, selectedContact)}
          />
        ) : null}
      </div>

      <Sheet
        open={sheetDebt !== undefined}
        onOpenChange={(open) => {
          if (!open) setSheetDebtId(null)
        }}
      >
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          variant="screen"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader title={sheetContact?.name ?? "Chi tiết khoản nợ"} />
          {isSheetReady && sheetDebt && sheetContact ? (
            <React.Fragment key={sheetDebt.id}>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
                <DebtDetailInfo {...getDetailProps(sheetDebt, sheetContact)} />
              </div>
              <SheetFooter>
                <DebtRecordPaymentButton {...getDetailProps(sheetDebt, sheetContact)} />
              </SheetFooter>
            </React.Fragment>
          ) : (
            <div
              className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pt-px pb-4"
              role="status"
              aria-label="Đang tải chi tiết khoản nợ"
            >
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
