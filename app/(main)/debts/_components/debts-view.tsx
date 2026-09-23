"use client"

import * as React from "react"
import { HandCoinsIcon, SearchIcon, FileTextIcon } from "lucide-react"

import type { Account } from "@/lib/accounts/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"

import { filterDebts, type DebtFilter } from "../_lib/filter-debts"
import type { Contact, Debt, NewDebt, NewDebtPayment } from "../_types/debt"
import { DebtDetailPanel } from "./debt-detail-panel"
import { DebtTable } from "./debt-table"

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
  const [filter, setFilter] = React.useState<DebtFilter>("all")
  const [query, setQuery] = React.useState("")
  const [selectedDebtId, setSelectedDebtId] = React.useState(initialSelectedDebtId ?? debts[0]?.id)
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN")
  const visibleDebts = filterDebts(debts, filter).filter((debt) => {
    const contact = contactById.get(debt.contactId)

    return normalizedQuery.length === 0 ||
      contact?.name.toLocaleLowerCase("vi-VN").includes(normalizedQuery) ||
      debt.note.toLocaleLowerCase("vi-VN").includes(normalizedQuery)
  })
  const selectedDebt =
    visibleDebts.find((debt) => debt.id === selectedDebtId) ?? visibleDebts[0]
  const selectedContact = selectedDebt
    ? contactById.get(selectedDebt.contactId)
    : undefined

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
  ]

  return (
    <div className="space-y-8">
      <section aria-labelledby="debts-heading" className="space-y-4">
        <h2 id="debts-heading" className="text-lg font-semibold">Khoản nợ</h2>
        <div className={`grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] ${visibleDebts.length === 0 ? "auto-rows-fr items-stretch" : "items-start"}`}>
          <Card className="gap-0 py-0">
            <div className="flex flex-col gap-3 border-b px-4 py-3 lg:h-16 lg:flex-row lg:items-center">
              <div className="relative w-full lg:max-w-xs">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Tìm khoản nợ hoặc tên người"
                  placeholder="Tìm khoản, tên..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={filter === item.value ? "default" : "outline"}
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                    <span className="opacity-60">{item.count}</span>
                  </Button>
                ))}
              </div>
            </div>
            {visibleDebts.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {debts.length > 0 ? <SearchIcon /> : <HandCoinsIcon />}
                  </EmptyMedia>
                  <EmptyTitle>{debts.length > 0 ? "Không tìm thấy khoản nợ" : "Chưa có khoản nợ"}</EmptyTitle>
                  <EmptyDescription>
                    {debts.length > 0 ? "Không có khoản nào phù hợp với bộ lọc hiện tại." : "Các khoản cho vay và đi vay sẽ xuất hiện tại đây sau khi được tạo."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <DebtTable
                contacts={contactById}
                debts={visibleDebts}
                selectedDebtId={selectedDebt?.id}
                onSelect={setSelectedDebtId}
              />
            )}
          </Card>
          {selectedDebt && selectedContact ? (
            <DebtDetailPanel
              key={selectedDebt.id}
              accounts={accounts}
              contacts={contacts}
              onChangeDebt={(values) => onChangeDebt(selectedDebt.id, values)}
              onEditPayment={(paymentId, values) => onEditPayment(selectedDebt.id, paymentId, values)}
              onDeletePayment={(paymentId) => onDeletePayment(selectedDebt.id, paymentId)}
              debt={selectedDebt}
              contact={selectedContact}
              onRecordPayment={(payment) =>
                onRecordPayment(selectedDebt.id, payment)
              }
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết khoản nợ</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><FileTextIcon /></EmptyMedia>
                    <EmptyTitle>Chưa có khoản nợ được chọn</EmptyTitle>
                    <EmptyDescription>
                      Chọn một khoản trong danh sách để xem số tiền còn lại, lãi suất và lịch sử thu trả.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
