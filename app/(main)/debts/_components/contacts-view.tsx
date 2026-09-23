import { BookUserIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { Contact, Debt, NewContact } from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"
import { ContactCard } from "./contact-card"

type ContactsViewProps = {
  contacts: Contact[]
  debts: Debt[]
  onAdd: (values: NewContact) => Promise<void>
  onEdit: (id: string, values: NewContact) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ContactsView({ contacts, debts, onAdd, onEdit, onDelete }: ContactsViewProps) {
  return (
    <section aria-labelledby="contacts-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 id="contacts-heading" className="text-lg font-semibold">Danh bạ</h2>
          <Badge variant="secondary">{contacts.length} người</Badge>
        </div>
        <AddContactSheet onAddContact={onAdd} />
      </div>
      {contacts.length === 0 ? (
        <Card>
          <CardContent>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookUserIcon /></EmptyMedia>
            <EmptyTitle>Danh bạ đang trống</EmptyTitle>
            <EmptyDescription>Thêm tên và mối quan hệ để gắn khoản vay với đúng người.</EmptyDescription>
          </EmptyHeader>
        </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              hasDebts={debts.some((debt) => debt.contactId === contact.id)}
              onEdit={(values) => onEdit(contact.id, values)}
              onDelete={() => onDelete(contact.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
