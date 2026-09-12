"use client"

import * as React from "react"
import { ChevronRightIcon, PlusIcon, type LucideIcon } from "lucide-react"

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { accountOptions } from "../../../_data/transaction-form-options"

type CashFlowCategory = {
  label: string
  icon: LucideIcon
}

type CashFlowFieldsProps = {
  categories: CashFlowCategory[]
  idPrefix: "expense" | "income"
  notePlaceholder: string
}

export function CashFlowFields({
  categories,
  idPrefix,
  notePlaceholder,
}: CashFlowFieldsProps) {
  const [category, setCategory] = React.useState("")

  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-amount`}>Số tiền</FieldLabel>
          <CurrencyInput id={`${idPrefix}-amount`} name="amount" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-account`}>Tài khoản</FieldLabel>
          <Select name="account" required>
            <SelectTrigger id={`${idPrefix}-account`} className="w-full">
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
        </Field>
      </div>

      <Field>
        <div className="flex items-center justify-between gap-3">
          <FieldLabel>Hạng mục</FieldLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            title="Trang hạng mục sẽ được bổ sung sau"
          >
            Xem tất cả
            <ChevronRightIcon />
          </Button>
        </div>
        <input type="hidden" name="category" value={category} />
        <ToggleGroup
          type="single"
          variant="outline"
          value={category}
          onValueChange={setCategory}
          className="grid w-full grid-cols-2 sm:grid-cols-3"
          aria-label="Chọn hạng mục giao dịch"
        >
          {categories.map(({ label, icon: Icon }) => (
            <ToggleGroupItem
              key={label}
              value={label}
              className="w-full justify-start"
            >
              <Icon />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <DateTimeFields idPrefix={idPrefix} required />

      <Collapsible>
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
              placeholder={notePlaceholder}
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>
  )
}
