"use client"

import * as React from "react"
import { HandCoinsIcon, SaveIcon } from "lucide-react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { getCurrentLocalDateTime } from "@/lib/date-time"

import type { Contact, DebtDirection, NewDebt } from "../_types/debt"

type AddDebtSheetProps = {
  contacts: Contact[]
  onAddDebt: (debt: NewDebt) => void
}

export function AddDebtSheet({ contacts, onAddDebt }: AddDebtSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [direction, setDirection] = React.useState<DebtDirection>("lent")
  const today = React.useMemo(() => getCurrentLocalDateTime().date, [])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" disabled={contacts.length === 0}>
          <HandCoinsIcon />
          Ghi khoản nợ
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ghi khoản nợ</SheetTitle>
          <SheetDescription>
            Ghi lại một khoản đang cho vay hoặc đang đi vay.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)

            onAddDebt({
              contactId: String(formData.get("contactId")),
              direction,
              amount: Number(formData.get("amount")),
              paidAmount: 0,
              note: String(formData.get("note")),
              recordedAt: String(formData.get("recordedAt")),
              dueAt: String(formData.get("dueAt") || "") || undefined,
            })
            form.reset()
            setDirection("lent")
            setOpen(false)
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="debt-direction">Loại khoản nợ</FieldLabel>
                <Select
                  value={direction}
                  onValueChange={(value) => setDirection(value as DebtDirection)}
                >
                  <SelectTrigger id="debt-direction" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lent">Tôi cho vay</SelectItem>
                    <SelectItem value="borrowed">Tôi đi vay</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="debt-contact">Người liên quan</FieldLabel>
                <Select name="contactId" required>
                  <SelectTrigger id="debt-contact" className="w-full">
                    <SelectValue placeholder="Chọn từ danh bạ" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="debt-amount">Số tiền</FieldLabel>
                <CurrencyInput id="debt-amount" name="amount" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="debt-note">Nội dung</FieldLabel>
                <Textarea id="debt-note" name="note" required placeholder="Ví dụ: Cho mượn đóng học phí" />
              </Field>
              <Field>
                <FieldLabel htmlFor="debt-recorded-at">Ngày ghi</FieldLabel>
                <Input id="debt-recorded-at" name="recordedAt" type="date" defaultValue={today} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="debt-due-at">Hẹn trả</FieldLabel>
                <Input id="debt-due-at" name="dueAt" type="date" min={today} />
              </Field>
            </FieldGroup>
          </div>
          <SheetFooter>
            <Button type="submit">
              <SaveIcon />
              Lưu khoản nợ
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
