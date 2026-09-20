"use client"

import * as React from "react"
import { HandCoinsIcon, SearchIcon } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"
import { Badge } from "@/components/ui/badge"
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
import type { Contact, Debt, NewDebtPayment } from "../_types/debt"
import { ContactsView } from "./contacts-view"
import { DebtDetailPanel } from "./debt-detail-panel"
import { DebtTable } from "./debt-table"

type DebtsViewProps = {
  contacts: Contact[]
  debts: Debt[]
  onRecordPayment: (debtId: string, payment: NewDebtPayment) => void
}

export function DebtsView({
  contacts,
  debts,
  onRecordPayment,
}: DebtsViewProps) {
  const [filter, setFilter] = React.useState<DebtFilter>("all")
  const [query, setQuery] = React.useState("")
  const [selectedDebtId, setSelectedDebtId] = React.useState(debts[0]?.id)
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
    <Tabs defaultValue="debts" className="gap-6">
      <TabsList>
        <TabsTrigger value="debts">
          Khoản nợ <Badge variant="secondary">{debts.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="contacts">
          Danh bạ <Badge variant="secondary">{contacts.length}</Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContents mode="layout">
        <TabsContent value="debts" className="p-px">
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-col gap-3 border-b px-4 py-3 lg:h-16 lg:flex-row lg:items-center">
                <div className="relative w-full lg:max-w-xs">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
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
                      <HandCoinsIcon />
                    </EmptyMedia>
                    <EmptyTitle>Chưa có khoản nợ</EmptyTitle>
                    <EmptyDescription>
                      Không có khoản nào phù hợp với bộ lọc hiện tại.
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
            </section>
            {selectedDebt && selectedContact ? (
              <DebtDetailPanel
                debt={selectedDebt}
                contact={selectedContact}
                onRecordPayment={(payment) =>
                  onRecordPayment(selectedDebt.id, payment)
                }
              />
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="contacts" className="p-px">
          <ContactsView contacts={contacts} debts={debts} />
        </TabsContent>
      </TabsContents>
    </Tabs>
  )
}
