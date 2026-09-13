"use client"

import * as React from "react"
import { HandCoinsIcon } from "lucide-react"

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
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { filterDebts, type DebtFilter } from "../_lib/filter-debts"
import type { Contact, Debt } from "../_types/debt"
import { ContactsView } from "./contacts-view"
import { DebtCard } from "./debt-card"

type DebtsViewProps = {
  contacts: Contact[]
  debts: Debt[]
}

export function DebtsView({ contacts, debts }: DebtsViewProps) {
  const [filter, setFilter] = React.useState<DebtFilter>("all")
  const visibleDebts = filterDebts(debts, filter)
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))

  const filters: Array<{ value: DebtFilter; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "lent", label: "Cho vay" },
    { value: "borrowed", label: "Đi vay" },
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
        <TabsContent value="debts" className="space-y-4 p-px">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={filter === item.value ? "default" : "outline"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {visibleDebts.length === 0 ? (
            <Card>
              <CardHeader>
                <HandCoinsIcon className="size-5 text-muted-foreground" />
                <CardTitle>Chưa có khoản nợ</CardTitle>
                <CardDescription>Không có khoản nào phù hợp với bộ lọc hiện tại.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-3">
              {visibleDebts.map((debt) => {
                const contact = contactById.get(debt.contactId)
                return contact ? <DebtCard key={debt.id} debt={debt} contact={contact} /> : null
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="contacts" className="p-px">
          <ContactsView contacts={contacts} debts={debts} />
        </TabsContent>
      </TabsContents>
    </Tabs>
  )
}
