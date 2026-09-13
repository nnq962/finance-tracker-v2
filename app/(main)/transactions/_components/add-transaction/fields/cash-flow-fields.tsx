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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getLocalDateTime } from "@/lib/date-time"

import type { TransactionFieldProps } from "../form-types"

type CashFlowFieldsProps = TransactionFieldProps & {
  idPrefix: "expense" | "income"
  notePlaceholder: string
}

export function CashFlowFields({
  accounts,
  categoryGroups,
  defaultValues,
  idPrefix,
  notePlaceholder,
}: CashFlowFieldsProps) {
  const availableAccounts = accounts.filter(
    (account) =>
      account.status === "active" || account.id === defaultValues?.accountId,
  )
  const availableGroups = categoryGroups.filter(
    (group) => group.type === idPrefix && group.items.length > 0,
  )
  const defaultCategoryIsMissing =
    Boolean(defaultValues?.categoryId) &&
    !availableGroups.some((group) =>
      group.items.some((item) => item.id === defaultValues?.categoryId),
    )
  const defaultDateTime = defaultValues
    ? getLocalDateTime(defaultValues.occurredAt)
    : undefined

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-amount`}>Số tiền</FieldLabel>
          <CurrencyInput
            key={`${idPrefix}-${defaultValues?.id ?? "new"}-amount`}
            id={`${idPrefix}-amount`}
            name="amount"
            defaultValue={
              defaultValues ? Math.abs(defaultValues.amount) : undefined
            }
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-account`}>Tài khoản</FieldLabel>
          <Select
            name="accountId"
            defaultValue={defaultValues?.accountId}
            required
          >
            <SelectTrigger id={`${idPrefix}-account`} className="w-full">
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
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-category`}>Hạng mục</FieldLabel>
        <Select
          name="categoryId"
          defaultValue={defaultValues?.categoryId}
          required
        >
          <SelectTrigger id={`${idPrefix}-category`} className="w-full">
            <SelectValue placeholder="Chọn hạng mục con" />
          </SelectTrigger>
          <SelectContent>
            {defaultCategoryIsMissing && defaultValues?.categoryId ? (
              <SelectGroup>
                <SelectLabel>
                  {defaultValues.categoryGroupName ?? "Hạng mục đã ngừng sử dụng"}
                </SelectLabel>
                <SelectItem value={defaultValues.categoryId}>
                  {defaultValues.categoryName ?? "Hạng mục cũ"}
                </SelectItem>
              </SelectGroup>
            ) : null}
            {availableGroups.map((group) => (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.name}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <DateTimeFields
        idPrefix={idPrefix}
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
            <FieldLabel htmlFor={`${idPrefix}-note`} className="sr-only">
              Ghi chú
            </FieldLabel>
            <Textarea
              id={`${idPrefix}-note`}
              name="note"
              defaultValue={defaultValues?.note}
              placeholder={notePlaceholder}
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>
  )
}
