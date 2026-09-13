"use client"

import * as React from "react"
import { PlusIcon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import type { NewContact } from "../_types/debt"

type AddContactSheetProps = {
  onAddContact: (contact: NewContact) => void
}

export function AddContactSheet({ onAddContact }: AddContactSheetProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline">
          <PlusIcon />
          Thêm người
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Thêm người vào danh bạ</SheetTitle>
          <SheetDescription>
            Lưu thông tin người liên quan để ghi khoản vay hoặc cho vay.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)

            onAddContact({
              name: String(formData.get("name")),
              phone: String(formData.get("phone") || "") || undefined,
              note: String(formData.get("note") || "") || undefined,
            })
            form.reset()
            setOpen(false)
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="contact-name">Họ và tên</FieldLabel>
                <Input id="contact-name" name="name" required autoComplete="name" />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-phone">Số điện thoại</FieldLabel>
                <Input id="contact-phone" name="phone" type="tel" autoComplete="tel" />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-note">Ghi chú</FieldLabel>
                <Textarea id="contact-note" name="note" placeholder="Mối quan hệ hoặc thông tin cần nhớ" />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button type="submit">
              <SaveIcon />
              Lưu người liên hệ
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
