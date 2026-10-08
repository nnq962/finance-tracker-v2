"use client"

import * as React from "react"
import { SaveIcon } from "lucide-react"

import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { InlineInput } from "@/components/forms/inline-input"
import { SettingsFieldRow, SettingsGroup, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getInitials } from "@/lib/debts/initials"
import { actionErrorMessage } from "@/lib/stale-deploy"
import { cn } from "@/lib/utils"

import type { Contact, NewContact } from "../_types/debt"
import { ContactAvatar } from "./contact-avatar"

/** The relationships most people are, a tap away; any other is typed. */
const RELATIONSHIPS = ["Bạn bè", "Gia đình", "Đồng nghiệp", "Hàng xóm"]

type AddContactSheetProps = {
  /** The person being edited; none adds one. */
  contact?: Contact
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocusRef?: React.RefObject<HTMLElement | null>
  onAddContact: (contact: NewContact) => Promise<unknown>
}

/**
 * A person of the debts' contacts, added or edited as rows of a group: their
 * avatar at the top, its initials following the name as it is typed; the
 * name; the relationship, with the usual ones as chips; a phone number to
 * call them from their screen; and a note.
 */
export function AddContactSheet({ contact, onAddContact, open, onOpenChange, returnFocusRef }: AddContactSheetProps) {
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [name, setName] = React.useState(contact?.name ?? "")
  const [relationship, setRelationship] = React.useState(contact?.relationship ?? "")
  const submitting = React.useRef(false)
  const id = React.useId()

  // Each opening starts from the person as saved, or empty.
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setErrorMessage(null)
      setNameError(null)
      setName(contact?.name ?? "")
      setRelationship(contact?.relationship ?? "")
    }
  }

  const fitNote = (area: HTMLTextAreaElement) => {
    area.style.height = "auto"
    area.style.height = `${area.scrollHeight}px`
  }

  return (
    <PageSheet
      title={contact ? "Sửa người" : "Thêm người"}
      disabled={pending}
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting.current) return
        onOpenChange(nextOpen)
      }}
      onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}
    >
      <form
        noValidate
        className="flex flex-1 flex-col"
        aria-busy={pending}
        onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          const data = new FormData(event.currentTarget)
          if (!name.trim()) {
            setNameError("Nhập tên.")
            document.getElementById(`${id}-name`)?.focus()
            return
          }
          submitting.current = true
          setPending(true)
          setErrorMessage(null)
          try {
            await onAddContact({
              name: name.trim(),
              relationship: relationship.trim() || undefined,
              phone: String(data.get("phone") || "").trim() || undefined,
              note: String(data.get("note") || "").trim() || undefined,
            })
            onOpenChange(false)
          } catch (error) {
            setErrorMessage(actionErrorMessage(error, "Không thể lưu người liên hệ."))
          } finally {
            submitting.current = false
            setPending(false)
          }
        }}
      >
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-6 pb-4">
          <div className="flex justify-center pt-2">
            {/* The initials the person will have, from the name being typed. */}
            <ContactAvatar contactId={contact?.id} initials={getInitials(name)} size="lg" />
          </div>

          <div className="flex flex-col gap-2">
            <SettingsGroup>
              <SettingsFieldRow htmlFor={`${id}-name`} title="Tên" invalid={Boolean(nameError)}>
                <InlineInput
                  id={`${id}-name`}
                  name="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError(null)
                  }}
                  placeholder="Họ và tên"
                  maxLength={80}
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(nameError) || undefined}
                />
              </SettingsFieldRow>
              <SettingsFieldRow htmlFor={`${id}-relationship`} title="Mối quan hệ">
                <InlineInput
                  id={`${id}-relationship`}
                  name="relationship"
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                  placeholder="Tuỳ chọn"
                  maxLength={80}
                  autoComplete="off"
                />
              </SettingsFieldRow>
              {/* The usual ones, under their row with no line between. */}
              <li className="px-4 pb-3">
                <ToggleGroup
                  type="single"
                  size="sm"
                  className="flex-wrap"
                  value={RELATIONSHIPS.includes(relationship.trim()) ? relationship.trim() : ""}
                  onValueChange={(value) => setRelationship(value)}
                  aria-label="Chọn nhanh mối quan hệ"
                >
                  {RELATIONSHIPS.map((item) => (
                    <ToggleGroupItem key={item} value={item}>
                      {item}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </li>
              <SettingsFieldRow htmlFor={`${id}-phone`} title="Số điện thoại">
                <InlineInput
                  id={`${id}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={contact?.phone}
                  placeholder="Tuỳ chọn"
                  maxLength={30}
                  autoComplete="off"
                />
              </SettingsFieldRow>
              {/* The note typed in place, as tall as a row (64) and growing with what is written. */}
              <li className={cn("flex min-h-16 items-center px-4 py-3", settingsSeparatorClassName())}>
                <label htmlFor={`${id}-note`} className="sr-only">
                  Ghi chú
                </label>
                <textarea
                  // Fitted once mounted: an edited person's note of several lines shows whole.
                  ref={(area) => {
                    if (area) fitNote(area)
                  }}
                  id={`${id}-note`}
                  name="note"
                  rows={1}
                  defaultValue={contact?.note}
                  placeholder="Ghi chú (tuỳ chọn)"
                  maxLength={500}
                  onInput={(event) => fitNote(event.currentTarget)}
                  className="block min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </li>
            </SettingsGroup>
            {nameError ? <FieldError className="px-4">{nameError}</FieldError> : null}
          </div>
        </fieldset>
        <PageSheetFooter>
          {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            <SaveIcon />
            {pending ? "Đang lưu…" : contact ? "Lưu thay đổi" : "Lưu người"}
          </Button>
        </PageSheetFooter>
      </form>
    </PageSheet>
  )
}
