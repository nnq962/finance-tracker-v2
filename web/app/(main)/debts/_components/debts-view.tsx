"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  FileTextIcon,
  HandCoinsIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import type { Account } from "@/lib/accounts/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import {
  compareDebtsByUrgency,
  getDebtDeadline,
  getDebtMetrics,
} from "../_lib/debt-presentation"
import { filterDebts, type DebtFilter } from "../_lib/filter-debts"
import type { Contact, Debt, NewDebt, NewDebtPayment } from "../_types/debt"
import {
  DebtContactHeader,
  DebtDetailInfo,
  DebtDetailPanel,
  DebtActionsMenu,
  DebtRecordPaymentButton,
} from "./debt-detail-panel"
import { DebtListItem } from "./debt-list-item"

// Matches Tailwind's `xl`, where the detail panel sits beside the list.
const SIDE_PANEL_QUERY = "(min-width: 80rem)"

type DebtsViewProps = {
  onChangeDebt: (id: string, values: NewDebt | null) => Promise<void>
  initialSelectedDebtId?: string
  accounts: Account[]
  onEditPayment: (debtId: string, paymentId: string, values: NewDebtPayment) => Promise<void>
  onDeletePayment: (debtId: string, paymentId: string) => Promise<void>
  contacts: Contact[]
  debts: Debt[]
  onRecordPayment: (debtId: string, payment: NewDebtPayment) => Promise<void>
  emptyAction?: React.ReactNode
}

function isSettled(debt: Debt) {
  return debt.status === "settled" || getDebtMetrics(debt).remainingAmount <= 0
}

export function DebtsView({
  onChangeDebt,
  contacts,
  initialSelectedDebtId,
  debts,
  onRecordPayment,
  accounts,
  onEditPayment,
  onDeletePayment,
  emptyAction,
}: DebtsViewProps) {
  const router = useRouter()
  const [, startNavigation] = React.useTransition()
  const [filter, setFilter] = React.useState<DebtFilter>("all")
  const [query, setQuery] = React.useState("")
  const [sheetDebtId, setSheetDebtId] = React.useState<string | null>(null)
  const selectedDebtId = initialSelectedDebtId ?? debts[0]?.id
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN")
  const overdueCount = debts.filter((debt) => getDebtDeadline(debt).isOverdue).length
  // The overdue chip disappears once nothing is overdue; fall back to all.
  const activeFilter = filter === "overdue" && overdueCount === 0 ? "all" : filter
  const visibleDebts = filterDebts(debts, activeFilter).filter((debt) => {
    const contact = contactById.get(debt.contactId)

    return normalizedQuery.length === 0 ||
      contact?.name.toLocaleLowerCase("vi-VN").includes(normalizedQuery) ||
      debt.note.toLocaleLowerCase("vi-VN").includes(normalizedQuery)
  })
  const openDebts = visibleDebts.filter((debt) => !isSettled(debt)).sort(compareDebtsByUrgency)
  const settledDebts = visibleDebts
    .filter(isSettled)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
  const selectedDebt = debts.find((debt) => debt.id === selectedDebtId)
  const selectedContact = selectedDebt
    ? contactById.get(selectedDebt.contactId)
    : undefined
  // Payments are only loaded for the selected debt, so the sheet waits for
  // the navigation that selects it. A deleted debt closes the sheet.
  const sheetDebt = sheetDebtId ? debts.find((debt) => debt.id === sheetDebtId) : undefined
  const sheetContact = sheetDebt ? contactById.get(sheetDebt.contactId) : undefined
  const isSheetReady = sheetDebt !== undefined && sheetDebt.id === selectedDebtId

  const filters: Array<{ value: DebtFilter; label: string; count: number }> = [
    { value: "all", label: "Tất cả", count: debts.length },
    {
      value: "lent",
      label: "Cho vay",
      count: debts.filter((debt) => debt.direction === "lent").length,
    },
    {
      value: "borrowed",
      label: "Đi vay",
      count: debts.filter((debt) => debt.direction === "borrowed").length,
    },
    ...(overdueCount > 0
      ? [{ value: "overdue" as const, label: "Quá hạn", count: overdueCount }]
      : []),
  ]

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
      onChangeDebt: (values: NewDebt | null) => onChangeDebt(debt.id, values),
      onEditPayment: (paymentId: string, values: NewDebtPayment) =>
        onEditPayment(debt.id, paymentId, values),
      onDeletePayment: (paymentId: string) => onDeletePayment(debt.id, paymentId),
      onRecordPayment: (payment: NewDebtPayment) => onRecordPayment(debt.id, payment),
    }
  }

  function renderDebtList(items: Debt[]) {
    return (
      <ul className="grid gap-3">
        {items.map((debt) => {
          const contact = contactById.get(debt.contactId)
          if (!contact) return null

          return (
            <li key={debt.id}>
              <DebtListItem
                contact={contact}
                debt={debt}
                selected={debt.id === selectedDebt?.id}
                onSelect={() => selectDebt(debt.id)}
              />
            </li>
          )
        })}
      </ul>
    )
  }

  if (debts.length === 0) {
    return (
      <Card>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HandCoinsIcon />
            </EmptyMedia>
            <EmptyTitle>Chưa có khoản nợ</EmptyTitle>
            <EmptyDescription>
              {contacts.length > 0
                ? "Ghi lại khoản cho vay hoặc đi vay để theo dõi số còn lại, hạn trả và lịch sử thu trả."
                : "Thêm người vào danh bạ trước, sau đó ghi lại khoản cho vay hoặc đi vay với họ."}
            </EmptyDescription>
          </EmptyHeader>
          {emptyAction ? <EmptyContent>{emptyAction}</EmptyContent> : null}
        </Empty>
      </Card>
    )
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InputGroup className="sm:max-w-xs">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Tìm khoản nợ hoặc tên người"
              placeholder="Tìm tên, ghi chú..."
            />
            {query ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => setQuery("")}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
          <div className="-mx-1 overflow-x-auto px-1 pt-1 pb-1">
            <ToggleGroup
              type="single"
              value={activeFilter}
              onValueChange={(value) => {
                if (value) setFilter(value as DebtFilter)
              }}
              aria-label="Lọc khoản nợ"
            >
              {filters.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value}>
                  {item.label}
                  <span className="opacity-60">{item.count}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {visibleDebts.length === 0 ? (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>Không tìm thấy khoản nợ</EmptyTitle>
                <EmptyDescription>
                  Không có khoản nào phù hợp với bộ lọc hiện tại.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : null}

        {openDebts.length > 0 ? renderDebtList(openDebts) : null}

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
            <CollapsibleContent className="pt-3">
              {renderDebtList(settledDebts)}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>

      {/* The 1px padding keeps the card's outer ring inside the scroll box. */}
      <div className="hidden xl:sticky xl:top-20 xl:-m-px xl:block xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto xl:p-px">
        {selectedDebt && selectedContact ? (
          <DebtDetailPanel
            key={selectedDebt.id}
            {...getDetailProps(selectedDebt, selectedContact)}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết khoản nợ</CardTitle>
            </CardHeader>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileTextIcon /></EmptyMedia>
                  <EmptyTitle>Chưa chọn khoản nợ</EmptyTitle>
                  <EmptyDescription>
                    Chọn một khoản trong danh sách để xem số còn lại, lãi suất
                    và lịch sử thu trả.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet
        open={sheetDebt !== undefined}
        onOpenChange={(open) => {
          if (!open) setSheetDebtId(null)
        }}
      >
        <SheetContent
          showCloseButton={false}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader
            title="Chi tiết khoản nợ"
            description="Số còn lại, lãi suất và lịch sử thu trả của khoản nợ."
          />
          {isSheetReady && sheetDebt && sheetContact ? (
            <React.Fragment key={sheetDebt.id}>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pt-px pb-4">
                <div className="flex items-center justify-between gap-3">
                  <DebtContactHeader contact={sheetContact} />
                  <DebtActionsMenu {...getDetailProps(sheetDebt, sheetContact)} />
                </div>
                <Separator variant="chunky" />
                <DebtDetailInfo {...getDetailProps(sheetDebt, sheetContact)} />
              </div>
              <SheetFooter>
                <div className="grid grid-cols-2 gap-2">
                  <SheetClose asChild>
                    <Button type="button" variant="outline">
                      <ArrowLeftIcon />
                      Quay lại
                    </Button>
                  </SheetClose>
                  <DebtRecordPaymentButton {...getDetailProps(sheetDebt, sheetContact)} />
                </div>
              </SheetFooter>
            </React.Fragment>
          ) : (
            <div
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pt-px pb-4"
              role="status"
              aria-label="Đang tải chi tiết khoản nợ"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Separator variant="chunky" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
