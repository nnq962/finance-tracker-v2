import { BookUserIcon } from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Contact, Debt } from "../_types/debt"
import { ContactCard } from "./contact-card"

type ContactsViewProps = {
  contacts: Contact[]
  debts: Debt[]
}

export function ContactsView({ contacts, debts }: ContactsViewProps) {
  if (contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <BookUserIcon className="size-5 text-muted-foreground" />
          <CardTitle>Danh bạ đang trống</CardTitle>
          <CardDescription>Thêm một người để bắt đầu theo dõi khoản vay.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          debts={debts.filter((debt) => debt.contactId === contact.id)}
        />
      ))}
    </div>
  )
}
