"use client"

import { PlusIcon } from "lucide-react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Button } from "@/components/ui/button"
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
import { getLocalDateTime } from "@/lib/date-time"

import type { TransactionFieldProps } from "../form-types"

function AccountSelect({
  accounts,
  defaultValue,
  id,
  name,
}: {
  accounts: TransactionFieldProps["accounts"]
  defaultValue?: string
  id: string
  name: string
}) {
  const availableAccounts = accounts.filter(
    (account) => account.status === "active" || account.id === defaultValue,
  )

  return (
    <Select name={name} defaultValue={defaultValue} required>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Chọn tài khoản" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {availableAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function TransferFields({
  accounts,
  defaultValues,
}: TransactionFieldProps) {
  const defaultDateTime = defaultValues
    ? getLocalDateTime(defaultValues.occurredAt)
    : undefined

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="transfer-amount">Số tiền</FieldLabel>
          <CurrencyInput
            key={`${defaultValues?.id ?? "new"}-transfer-amount`}
            id="transfer-amount"
            name="amount"
            defaultValue={defaultValues?.amount}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="transfer-fee">Phí chuyển (nếu có)</FieldLabel>
          <CurrencyInput
            key={`${defaultValues?.id ?? "new"}-transfer-fee`}
            id="transfer-fee"
            name="fee"
            defaultValue={defaultValues?.fee}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="transfer-from-account">
            Từ tài khoản
          </FieldLabel>
          <AccountSelect
            accounts={accounts}
            defaultValue={defaultValues?.fromAccountId}
            id="transfer-from-account"
            name="fromAccountId"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="transfer-to-account">Đến tài khoản</FieldLabel>
          <AccountSelect
            accounts={accounts}
            defaultValue={defaultValues?.toAccountId}
            id="transfer-to-account"
            name="toAccountId"
          />
        </Field>
      </div>

      <DateTimeFields
        idPrefix="transfer"
        defaultDate={defaultDateTime?.date}
        defaultTime={defaultDateTime?.time}
        required
      />

      <Collapsible defaultOpen={Boolean(defaultValues?.note)}>
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
              defaultValue={defaultValues?.note}
              placeholder="Thêm ghi chú cho giao dịch chuyển khoản..."
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>
  )
}
