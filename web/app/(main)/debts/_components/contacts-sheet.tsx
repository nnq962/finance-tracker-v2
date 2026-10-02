"use client"

import * as React from "react"
import { BookUserIcon, PlusIcon } from "lucide-react"

import { SettingsGroup } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet"

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetNavHeader title="Danh bạ" description="Người cho vay hoặc đi vay với bạn." />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
          {contacts.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><BookUserIcon /></EmptyMedia>
                <EmptyTitle>Danh bạ đang trống</EmptyTitle>
                <EmptyDescription>Thêm tên và mối quan hệ để gắn khoản vay với đúng người.</EmptyDescription>
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
        </div>
        <SheetFooter>
          <Button type="button" className="w-full" onClick={() => setAdding(true)}>
            <PlusIcon />
            Thêm người
          </Button>
        </SheetFooter>
        <AddContactSheet open={adding} onOpenChange={setAdding} onAddContact={onAdd} />
      </SheetContent>
    </Sheet>
  )
}
