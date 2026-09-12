"use client"

import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { accountOptions } from "../../../_data/transaction-form-options"

function AccountSelect({ id, name }: { id: string; name: string }) {
  return (
    <Select name={name} required>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Chọn tài khoản" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {accountOptions.map((account) => (
            <SelectItem key={account} value={account}>
              {account}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function TransferFields() {
  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="transfer-amount">Số tiền</FieldLabel>
          <CurrencyInput id="transfer-amount" name="amount" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="transfer-fee">Phí chuyển (nếu có)</FieldLabel>
          <CurrencyInput id="transfer-fee" name="fee" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="transfer-from-account">
            Từ tài khoản
          </FieldLabel>
          <AccountSelect id="transfer-from-account" name="fromAccount" />
        </Field>
        <Field>
          <FieldLabel htmlFor="transfer-to-account">Đến tài khoản</FieldLabel>
          <AccountSelect id="transfer-to-account" name="toAccount" />
        </Field>
      </div>

      <DateTimeFields idPrefix="transfer" required />

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm">
            <PlusIcon />
            Thêm ghi chú
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Field>
            <FieldLabel htmlFor="transfer-note" className="sr-only">
              Ghi chú
            </FieldLabel>
            <Textarea
              id="transfer-note"
              name="note"
              placeholder="Thêm ghi chú cho giao dịch chuyển khoản..."
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>
  )
}
