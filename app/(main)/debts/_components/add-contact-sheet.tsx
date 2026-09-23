"use client"

import * as React from "react"
import { PencilIcon, PlusIcon, SaveIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet, SheetContent, SheetDescription, SheetFooter,
  SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import type { Contact, NewContact } from "../_types/debt"

type AddContactSheetProps = {
  contact?: Contact
  open?: boolean
  onOpenChange?: (open: boolean) => void
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>
  onAddContact: (contact: NewContact) => Promise<void>
}

export function AddContactSheet({ contact, onAddContact, open: controlledOpen, onOpenChange, returnFocusRef }: AddContactSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const submitting = React.useRef(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const id = React.useId()

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (submitting.current) return
      if (nextOpen) setErrorMessage(null)
      setOpen(nextOpen)
    }}>
      {controlledOpen === undefined ? <SheetTrigger asChild>
        <Button type="button" variant={contact ? "ghost" : "outline"} size={contact ? "icon-sm" : "sm"} aria-label={contact ? `Sửa ${contact.name}` : undefined}>
          {contact ? <PencilIcon /> : <><PlusIcon />Thêm người</>}
        </Button>
      </SheetTrigger> : null}
      <SheetContent showCloseButton={!pending} onOpenAutoFocus={(event) => event.preventDefault()} className="data-[side=right]:w-full sm:max-w-md!" onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}>
        <SheetHeader>
          <SheetTitle>{contact ? "Sửa người liên hệ" : "Thêm người vào danh bạ"}</SheetTitle>
          <SheetDescription>Lưu tên và mối quan hệ để dễ theo dõi các khoản nợ.</SheetDescription>
        </SheetHeader>
        <form className="flex min-h-0 flex-1 flex-col" aria-busy={pending} onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          const form = event.currentTarget
          const data = new FormData(form)
          const name = String(data.get("name") || "").trim()
          if (!name) {
            const input = form.elements.namedItem("name") as HTMLInputElement
            input.setCustomValidity("Vui lòng nhập tên người liên hệ.")
            input.reportValidity()
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
            setErrorMessage(error instanceof Error ? error.message : "Không thể lưu người liên hệ.")
          } finally {
            submitting.current = false
            setPending(false)
          }
        }}>
          <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <Card>
              <CardHeader><CardTitle>Thông tin người liên hệ</CardTitle></CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={`${id}-name`}>Họ và tên</FieldLabel>
                    <Input id={`${id}-name`} name="name" defaultValue={contact?.name} required maxLength={80} autoComplete="name" placeholder="Nhập họ và tên" onInput={(event) => event.currentTarget.setCustomValidity("")} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`${id}-relationship`}>Mối quan hệ</FieldLabel>
                    <Input id={`${id}-relationship`} name="relationship" defaultValue={contact?.relationship} maxLength={80} placeholder="Ví dụ: Đồng nghiệp, người yêu, anh trai" />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </fieldset>
          <SheetFooter>
            {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            <Button type="submit" disabled={pending}><SaveIcon />{pending ? "Đang lưu…" : contact ? "Lưu thay đổi" : "Lưu người liên hệ"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
