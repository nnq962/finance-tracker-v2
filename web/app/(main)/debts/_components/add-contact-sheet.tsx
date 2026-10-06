"use client"

import * as React from "react"
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react"
import { FormSection } from "@/components/app/form-section"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { RequiredMark } from "@/components/forms/required-mark"
import { Input } from "@/components/ui/input"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { actionErrorMessage } from "@/lib/stale-deploy"
import type { Contact, NewContact } from "../_types/debt"

type AddContactSheetProps = {
  contact?: Contact
  open?: boolean
  onOpenChange?: (open: boolean) => void
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
  onAddContact: (contact: NewContact) => Promise<unknown>
}

export function AddContactSheet({ contact, onAddContact, open: controlledOpen, onOpenChange, returnFocusRef }: AddContactSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const submitting = React.useRef(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const id = React.useId()
  const [nameError, setNameError] = React.useState<string | null>(null)

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (submitting.current) return
      if (nextOpen) {
        setErrorMessage(null)
        setNameError(null)
      }
      setOpen(nextOpen)
    }}>
      {controlledOpen === undefined ? <SheetTrigger asChild>
        <Button type="button" variant="ghost" size={contact ? "icon-sm" : "sm"} aria-label={contact ? `Sửa ${contact.name}` : undefined}>
          {contact ? <PencilIcon /> : <><PlusIcon />Thêm người</>}
        </Button>
      </SheetTrigger> : null}
      <SheetContent showCloseButton={false} aria-describedby={undefined} onOpenAutoFocus={(event) => event.preventDefault()} variant="screen" onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}>
        <SheetNavHeader
          title={contact ? "Sửa người liên hệ" : "Thêm người vào danh bạ"}
          disabled={pending}
        />
        <form noValidate className="flex min-h-0 flex-1 flex-col" aria-busy={pending} onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          const form = event.currentTarget
          const data = new FormData(form)
          const name = String(data.get("name") || "").trim()
          if (!name) {
            setNameError("Nhập họ và tên.")
            const input = form.elements.namedItem("name") as HTMLInputElement
            input.focus()
            return
          }
          submitting.current = true
          setPending(true)
          setErrorMessage(null)
          try {
            await onAddContact({
              name,
              relationship: String(data.get("relationship") || "").trim() || undefined,
            })
            setOpen(false)
          } catch (error) {
            setErrorMessage(actionErrorMessage(error, "Không thể lưu người liên hệ."))
          } finally {
            submitting.current = false
            setPending(false)
          }
        }}>
          <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <FormSection>
              <FieldGroup>
                <Field data-invalid={Boolean(nameError) || undefined}>
                  <FieldLabel htmlFor={`${id}-name`}>Họ và tên <RequiredMark /></FieldLabel>
                  <Input id={`${id}-name`} name="name" defaultValue={contact?.name} required maxLength={80} autoComplete="name" aria-invalid={Boolean(nameError) || undefined} onInput={() => setNameError(null)} />
                  {nameError ? <FieldError>{nameError}</FieldError> : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${id}-relationship`}>Mối quan hệ</FieldLabel>
                  <Input id={`${id}-relationship`} name="relationship" defaultValue={contact?.relationship} maxLength={80} />
                </Field>
              </FieldGroup>
            </FormSection>
          </fieldset>
          <SheetFooter>
            {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            <Button type="submit" className="w-full" disabled={pending}><SaveIcon />{pending ? "Đang lưu…" : contact ? "Lưu thay đổi" : "Lưu người liên hệ"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
