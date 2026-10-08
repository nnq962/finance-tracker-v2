"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BookUserIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"

import { FlowTiles } from "@/components/app/flow-tiles"
import { Money } from "@/components/app/money"
import { PageSheet, usePageSheetScreen } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { formatShortDate } from "@/lib/format-date"
import { searchKey } from "@/lib/search-text"
import { cn } from "@/lib/utils"

import { getDebtDeadline, getDebtMetrics } from "../_lib/debt-presentation"
import type { Contact, Debt, NewContact } from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"
import { ContactAvatar } from "./contact-avatar"
import { getDebtStatus } from "./debt-list-item"

type ContactsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  debts: Debt[]
  onAdd: (values: NewContact) => Promise<unknown>
  onEdit: (id: string, values: NewContact) => Promise<void>
  /** Deletes with an undo; the person has no debts. */
  onDelete: (id: string) => void
  /** Shows a debt on the page, the sheet closing. */
  onOpenDebt: (debtId: string) => void
  /** Opens the new-debt form with this person chosen. */
  onNewDebt: (contactId: string) => void
}

function isSettled(debt: Debt) {
  return debt.status === "settled" || getDebtMetrics(debt).remainingAmount <= 0
}

/** Where a person stands: what is left to collect from them and to pay them, and whether any of it is late. */
function getStanding(debts: Debt[]) {
  const open = debts.filter((debt) => !isSettled(debt))
  const left = (direction: Debt["direction"]) =>
    open.filter((debt) => debt.direction === direction).reduce((total, debt) => total + getDebtMetrics(debt).remainingAmount, 0)
  return {
    open,
    settled: debts.filter(isSettled),
    toCollect: left("lent"),
    toPay: left("borrowed"),
    count: (direction: Debt["direction"]) => open.filter((debt) => debt.direction === direction).length,
    overdue: open.some((debt) => getDebtDeadline(debt).isOverdue),
  }
}

/** A person in the list: their relationship, and on the right what they and the user owe each other on balance. */
function ContactListRow({ contact, debts, onSelect }: { contact: Contact; debts: Debt[]; onSelect: () => void }) {
  const standing = getStanding(debts)
  const net = standing.toCollect - standing.toPay

  return (
    <SettingsRow
      media={<ContactAvatar contactId={contact.id} initials={contact.initials} />}
      title={contact.name}
      description={contact.relationship || undefined}
      action={
        standing.open.length > 0 ? (
          <span className="flex flex-col items-end">
            <Money amount={net} sign={net === 0 ? "never" : "always"} size="sm" tone={net > 0 ? "income" : "default"} />
            <span className={cn("text-xs text-muted-foreground", standing.overdue && "text-expense")}>
              {standing.overdue ? "Quá hạn" : net > 0 ? "Cần thu" : net < 0 ? "Cần trả" : "Hoà"}
            </span>
          </span>
        ) : undefined
      }
      onClick={onSelect}
    />
  )
}

/** A debt on a person's screen: its note (the person goes without saying), which way and when, and what is left. */
function ContactDebtRow({ debt, onSelect }: { debt: Debt; onSelect: () => void }) {
  const { remainingAmount, totalAmount } = getDebtMetrics(debt)
  const status = getDebtStatus(debt)
  const way = debt.direction === "lent" ? "Cho vay" : "Đi vay"

  return (
    <SettingsRow
      title={debt.note || way}
      description={`${way} · ${formatShortDate(debt.recordedAt)}`}
      action={
        <span className="flex flex-col items-end">
          <Money
            amount={status.isSettled ? totalAmount : remainingAmount}
            sign="never"
            size="sm"
            tone={status.isSettled ? "muted" : "default"}
          />
          <span className={cn("text-xs text-muted-foreground", status.isOverdue && "text-expense")}>{status.label}</span>
        </span>
      }
      onClick={onSelect}
    />
  )
}

/**
 * One person, as a deeper screen of the contacts: who they are, what is left
 * with them each way, their open debts (each opening on the page), the
 * settled ones folded away, a new debt with them, a call, and deleting them
 * once nothing is recorded with them.
 */
function ContactScreen({
  contact,
  debts,
  onOpenDebt,
  onNewDebt,
  onDelete,
}: {
  contact: Contact
  debts: Debt[]
  onOpenDebt: (debtId: string) => void
  onNewDebt: () => void
  onDelete: () => void
}) {
  const standing = getStanding(debts)
  const details = [contact.relationship, contact.phone].filter(Boolean).join(" · ")

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col items-center pt-2 text-center">
        <ContactAvatar contactId={contact.id} initials={contact.initials} size="lg" />
        <p className="mt-3 max-w-full truncate text-lg font-semibold">{contact.name}</p>
        {details ? <p className="mt-0.5 text-sm text-muted-foreground">{details}</p> : null}
      </div>

      <FlowTiles
        tiles={[
          {
            value: "lent",
            label: "Cần thu",
            amount: standing.toCollect,
            caption: standing.count("lent") ? `${standing.count("lent")} khoản` : "Không có",
            icon: ArrowDownLeftIcon,
            tone: "income",
          },
          {
            value: "borrowed",
            label: "Cần trả",
            amount: standing.toPay,
            caption: standing.count("borrowed") ? `${standing.count("borrowed")} khoản` : "Không có",
            icon: ArrowUpRightIcon,
            tone: "expense",
          },
        ]}
      />

      {standing.open.length > 0 ? (
        <SettingsGroup title="Khoản đang mở">
          {standing.open.map((debt) => (
            <ContactDebtRow key={debt.id} debt={debt} onSelect={() => onOpenDebt(debt.id)} />
          ))}
        </SettingsGroup>
      ) : null}

      {standing.settled.length > 0 ? (
        <SettingsGroup
          title="Đã tất toán"
          collapsible={{ showLabel: `Hiện ${standing.settled.length} khoản`, defaultOpen: standing.open.length === 0 }}
        >
          {standing.settled.map((debt) => (
            <ContactDebtRow key={debt.id} debt={debt} onSelect={() => onOpenDebt(debt.id)} />
          ))}
        </SettingsGroup>
      ) : null}

      {contact.note ? (
        <SettingsGroup>
          <SettingsRow title="Ghi chú" description={<span className="select-text">{contact.note}</span>} fullDescription />
        </SettingsGroup>
      ) : null}

      <SettingsGroup>
        <SettingsRow icon={PlusIcon} title={`Ghi khoản mới với ${contact.name}`} chevron={false} onClick={onNewDebt} />
        {contact.phone ? (
          <SettingsRow
            icon={PhoneIcon}
            title={`Gọi ${contact.phone}`}
            chevron={false}
            onClick={() => {
              window.location.href = `tel:${contact.phone?.replace(/[^\d+]/g, "")}`
            }}
          />
        ) : null}
      </SettingsGroup>

      <SettingsGroup footer={debts.length > 0 ? "Xoá được khi không còn khoản nào với người này." : undefined}>
        <SettingsRow destructive title="Xoá người" disabled={debts.length > 0} onClick={onDelete} />
      </SettingsGroup>
    </div>
  )
}

/**
 * The people debts are recorded with, opened from the debts page: a search,
 * then those with open debts (what is left with each on balance) and the
 * rest. A person opens as a deeper screen; adding and editing open their own
 * sheet over it. Closed, it opens again on the list, unsearched.
 */
export function ContactsSheet({ open, onOpenChange, ...props }: ContactsSheetProps) {
  const [adding, setAdding] = React.useState(false)

  return (
    <PageSheet
      title="Danh bạ"
      open={open}
      onOpenChange={onOpenChange}
      action={
        <Button type="button" variant="secondary" size="icon" aria-label="Thêm người" onClick={() => setAdding(true)}>
          <UserPlusIcon />
        </Button>
      }
    >
      <ContactsBody {...props} adding={adding} onAddingChange={setAdding} />
    </PageSheet>
  )
}

/** The sheet's content, inside it so a person can open as its deeper screen. */
function ContactsBody({
  contacts,
  debts,
  onAdd,
  onEdit,
  onDelete,
  onOpenDebt,
  onNewDebt,
  adding,
  onAddingChange,
}: Omit<ContactsSheetProps, "open" | "onOpenChange"> & { adding: boolean; onAddingChange: (adding: boolean) => void }) {
  const [query, setQuery] = React.useState("")
  const [personId, setPersonId] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  const person = contacts.find((contact) => contact.id === personId)
  const debtsOf = (contactId: string) => debts.filter((debt) => debt.contactId === contactId)
  const back = () => setPersonId(null)
  usePageSheetScreen(
    person
      ? {
          title: person.name,
          onBack: back,
          action: (
            <Button type="button" variant="secondary" size="icon" aria-label={`Sửa ${person.name}`} onClick={() => setEditingId(person.id)}>
              <PencilIcon />
            </Button>
          ),
        }
      : null,
  )

  const key = searchKey(query)
  const typed = key(query.trim())
  const byName = (left: Contact, right: Contact) => left.name.localeCompare(right.name, "vi")
  const shown = contacts
    .filter((contact) => !typed || [contact.name, contact.relationship, contact.phone].some((text) => text && key(text).includes(typed)))
    .sort(byName)
  const withDebts = shown.filter((contact) => debtsOf(contact.id).some((debt) => !isSettled(debt)))
  const others = shown.filter((contact) => !withDebts.includes(contact))
  const editedContact = contacts.find((contact) => contact.id === editingId)

  return (
    <>
      {person ? (
        <ContactScreen
          contact={person}
          debts={debtsOf(person.id)}
          onOpenDebt={onOpenDebt}
          onNewDebt={() => onNewDebt(person.id)}
          onDelete={() => {
            back()
            onDelete(person.id)
          }}
        />
      ) : null}

      <div className={cn("flex flex-col gap-6 pb-4", person && "hidden")}>
        {contacts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookUserIcon />
              </EmptyMedia>
              <EmptyTitle>Chưa có ai trong danh bạ</EmptyTitle>
            </EmptyHeader>
            <Button type="button" onClick={() => onAddingChange(true)}>
              <UserPlusIcon />
              Thêm người
            </Button>
          </Empty>
        ) : (
          <>
            <InputGroup variant="search" role="search">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="text"
                inputMode="search"
                enterKeyHint="search"
                aria-label="Tìm người"
                placeholder="Tìm người"
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label="Xoá tìm kiếm" onClick={() => setQuery("")}>
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>

            {withDebts.length > 0 ? (
              <SettingsGroup title={`Đang có khoản · ${withDebts.length}`}>
                {withDebts.map((contact) => (
                  <ContactListRow key={contact.id} contact={contact} debts={debtsOf(contact.id)} onSelect={() => setPersonId(contact.id)} />
                ))}
              </SettingsGroup>
            ) : null}
            {others.length > 0 ? (
              <SettingsGroup title={`Không có khoản · ${others.length}`}>
                {others.map((contact) => (
                  <ContactListRow key={contact.id} contact={contact} debts={debtsOf(contact.id)} onSelect={() => setPersonId(contact.id)} />
                ))}
              </SettingsGroup>
            ) : null}
            {shown.length === 0 ? (
              <p className="px-4 text-center text-sm text-muted-foreground">Không tìm thấy “{query.trim()}”</p>
            ) : null}
          </>
        )}
      </div>

      <AddContactSheet
        contact={editedContact}
        open={adding || editedContact !== undefined}
        onOpenChange={(next) => {
          if (next) return
          onAddingChange(false)
          setEditingId(null)
        }}
        onAddContact={(values) => (editedContact ? onEdit(editedContact.id, values) : onAdd(values))}
      />
    </>
  )
}
