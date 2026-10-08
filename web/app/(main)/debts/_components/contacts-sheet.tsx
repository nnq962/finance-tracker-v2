"use client"

import * as React from "react"
import { BookUserIcon, PlusIcon } from "lucide-react"

import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { Contact, Debt, NewContact } from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"
import { ContactRow } from "./contact-row"

type ContactsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  debts: Debt[]
  onAdd: (values: NewContact) => Promise<unknown>
  onEdit: (id: string, values: NewContact) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

/** The people debts are recorded with; opened from the debts list. */
export function ContactsSheet({ open, onOpenChange, contacts, debts, onAdd, onEdit, onDelete }: ContactsSheetProps) {
  const [adding, setAdding] = React.useState(false)

  return (
    <>
      <PageSheet
        title="Danh bạ"
        open={open}
        onOpenChange={onOpenChange}
        footer={
          <Button type="button" className="w-full" onClick={() => setAdding(true)}>
            <PlusIcon />
            Thêm người
          </Button>
        }
      >
        {contacts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><BookUserIcon /></EmptyMedia>
              <EmptyTitle>Chưa có người liên hệ</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <SettingsGroup title={`${contacts.length} người`}>
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                hasDebts={debts.some((debt) => debt.contactId === contact.id)}
                onEdit={(values) => onEdit(contact.id, values)}
                onDelete={() => onDelete(contact.id)}
              />
            ))}
          </SettingsGroup>
        )}
      </PageSheet>
      <AddContactSheet open={adding} onOpenChange={setAdding} onAddContact={onAdd} />
    </>
  )
}
