"use client"

import * as React from "react"
import {
  BookUserIcon,
  ChevronDownIcon,
  HandCoinsIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import type { Account } from "@/lib/accounts/types"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format-currency"

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
  onOpenContacts: () => void
  /** The totals, at the top of the list column. */
  summary: React.ReactNode
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
  onOpenContacts,
  summary,
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
  const overdueDebts = openDebts.filter((debt) => getDebtDeadline(debt).isOverdue)
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

  const contactsRow = (
    <SettingsGroup title="Danh bạ">
      <SettingsRow
        icon={BookUserIcon}
        color="blue"
        title="Người liên hệ"
        value={`${contacts.length} người`}
        onClick={onOpenContacts}
      />
    </SettingsGroup>
  )

  if (debts.length === 0) {
    return (
      <div className="space-y-6">
        {summary}
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HandCoinsIcon />
              </EmptyMedia>
              <EmptyTitle>Chưa có khoản nợ</EmptyTitle>
              <EmptyDescription>Thêm khoản vay đầu tiên để bắt đầu theo dõi.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Card>
        {contactsRow}
      </div>
    )
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-6">
        {summary}

        {overdueDebts.length > 0 ? (
          <SettingsGroup>
            <SettingsRow
              icon={TriangleAlertIcon}
              color="rose"
              title={`${overdueDebts.length} khoản quá hạn`}
              description={[...new Set(overdueDebts.map((debt) => contactById.get(debt.contactId)?.name))].filter(Boolean).join(", ")}
              // Opens the one overdue the longest; the rest sit at the top of their sections.
              onClick={() => selectDebt(overdueDebts[0].id)}
            />
          </SettingsGroup>
        ) : null}

        {sections.map(({ direction, label }) => {
          const items = openDebts.filter((debt) => debt.direction === direction)
          if (items.length === 0) return null
          const total = items.reduce((sum, debt) => sum + getDebtMetrics(debt).remainingAmount, 0)

          return (
            <SettingsGroup
              key={direction}
              title={label}
              action={
                <span className="shrink-0 text-xs font-semibold tabular-nums">
                  {formatCurrency(total, { signDisplay: "never" })}
                </span>
              }
            >
              {renderRows(items)}
            </SettingsGroup>
          )
        })}

        {settledDebts.length > 0 ? (
          <Collapsible defaultOpen={openDebts.length === 0}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="group/settled">
                Đã tất toán
                <Badge variant="outline">{settledDebts.length}</Badge>
                <ChevronDownIcon
                  className="transition-transform group-data-[state=open]/settled:rotate-180"
                  aria-hidden="true"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <SettingsGroup>{renderRows(settledDebts)}</SettingsGroup>
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        {contactsRow}
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
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
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
