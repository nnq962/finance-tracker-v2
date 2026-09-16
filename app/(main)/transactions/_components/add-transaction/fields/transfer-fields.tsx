"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { AccountLogo } from "@/components/account-logo"
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
  excludedAccountId,
  id,
  name,
  onValueChange,
  value,
}: {
  accounts: TransactionFieldProps["accounts"]
  excludedAccountId?: string
  id: string
  name: string
  onValueChange: (value: string) => void
  value: string
}) {
  const availableAccounts = accounts.filter(
    (account) => account.status === "active" || account.id === value,
  ).filter((account) => account.id !== excludedAccountId)

  return (
    <Select
      name={name}
      value={value}
      onValueChange={onValueChange}
      required
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Chọn tài khoản" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {availableAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <AccountLogo
                account={account}
                className="size-5! p-0.5! [&>svg]:size-3!"
              />
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
  const [fromAccountId, setFromAccountId] = React.useState(
    defaultValues?.fromAccountId ?? "",
  )
  const [toAccountId, setToAccountId] = React.useState(
    defaultValues?.toAccountId === defaultValues?.fromAccountId
      ? ""
      : (defaultValues?.toAccountId ?? ""),
  )
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
            excludedAccountId={toAccountId}
            id="transfer-from-account"
            name="fromAccountId"
            onValueChange={setFromAccountId}
            value={fromAccountId}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="transfer-to-account">Đến tài khoản</FieldLabel>
          <AccountSelect
            accounts={accounts}
            excludedAccountId={fromAccountId}
            id="transfer-to-account"
            name="toAccountId"
            onValueChange={setToAccountId}
            value={toAccountId}
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
