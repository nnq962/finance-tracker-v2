"use client"

import * as React from "react"
import { SearchIcon, UserPlusIcon, XIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { searchKey } from "@/lib/search-text"

import type { Contact } from "../_types/debt"
import { ContactAvatar } from "./contact-avatar"

/**
 * Every person of the contacts, on a deeper screen of a sheet: a search by
 * name, relationship or phone, adding someone new first, then everyone A–Z,
 * the chosen one ticked. A tap picks one and goes back.
 */
export function ContactPicker({
  contacts,
  value,
  onPick,
  onAdd,
}: {
  contacts: Contact[]
  value: string
  onPick: (id: string) => void
  /** Adds someone new, who is then picked. */
  onAdd?: () => void
}) {
  const [query, setQuery] = React.useState("")
  const key = searchKey(query)
  const typed = key(query.trim())
  const shown = contacts
    .filter((contact) => !typed || [contact.name, contact.relationship, contact.phone].some((text) => text && key(text).includes(typed)))
    .sort((left, right) => left.name.localeCompare(right.name, "vi"))

  return (
    <div className="flex flex-col gap-6 pb-4">
      {contacts.length > 0 ? (
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
      ) : null}
      {onAdd ? (
        <SettingsGroup>
          <SettingsRow icon={UserPlusIcon} title="Thêm người mới" chevron={false} onClick={onAdd} />
        </SettingsGroup>
      ) : null}
      {contacts.length > 0 ? (
        <SettingsGroup title="Danh bạ">
          {shown.length > 0 ? (
            shown.map((contact) => (
              <SettingsRow
                key={contact.id}
                media={<ContactAvatar contactId={contact.id} initials={contact.initials} />}
                title={contact.name}
                description={contact.relationship || undefined}
                checked={value === contact.id}
                onClick={() => onPick(contact.id)}
              />
            ))
          ) : (
            <SettingsRow title={`Không tìm thấy “${query.trim()}”`} />
          )}
        </SettingsGroup>
      ) : null}
    </div>
  )
}
