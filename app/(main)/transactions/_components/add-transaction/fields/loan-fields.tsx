"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PlusIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
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

import {
  accountOptions,
  counterpartyOptions,
} from "../../../_data/transaction-form-options"

const loanTypeOptions = [
  { value: "lend", label: "Cho vay", icon: ArrowUpRightIcon },
  { value: "borrow", label: "Đi vay", icon: ArrowDownLeftIcon },
  { value: "collect", label: "Thu nợ", icon: Undo2Icon },
  { value: "repay", label: "Trả nợ", icon: Redo2Icon },
] as const

type LoanType = (typeof loanTypeOptions)[number]["value"]

const counterpartyLabels: Record<LoanType, string> = {
  lend: "Người vay",
  borrow: "Người cho vay",
  collect: "Người vay",
  repay: "Người cho vay",
}

export function LoanFields() {
  const [loanType, setLoanType] = React.useState<LoanType>("lend")
  const counterpartyLabel = counterpartyLabels[loanType]

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Loại giao dịch</FieldLabel>
        <input type="hidden" name="loanType" value={loanType} />
        <ToggleGroup
          type="single"
          variant="outline"
          value={loanType}
          onValueChange={(value) => {
            if (value) setLoanType(value as LoanType)
          }}
          className="grid w-full grid-cols-2 sm:grid-cols-4"
          aria-label="Chọn loại giao dịch vay nợ"
        >
          {loanTypeOptions.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className="w-full">
              <Icon />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="loan-amount">Số tiền</FieldLabel>
          <CurrencyInput id="loan-amount" name="amount" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="loan-account">Tài khoản</FieldLabel>
          <Select name="account" required>
            <SelectTrigger id="loan-account" className="w-full">
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
        <FieldLabel htmlFor="loan-counterparty">
          {counterpartyLabel}
        </FieldLabel>
        <Select name="counterparty" required>
          <SelectTrigger id="loan-counterparty" className="w-full">
            <SelectValue placeholder={`Chọn ${counterpartyLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {counterpartyOptions.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <DateTimeFields idPrefix="loan" required />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="loan-due-date">
            Ngày đến hạn (tuỳ chọn)
          </FieldLabel>
          <Input id="loan-due-date" name="dueDate" type="date" />
        </Field>
        <Field>
          <FieldLabel htmlFor="loan-interest-rate">
            Lãi suất (tuỳ chọn)
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="loan-interest-rate"
              name="interestRate"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              pattern="[0-9]+([.,][0-9]+)?"
              placeholder="0"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>%/năm</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </div>

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm">
            <PlusIcon />
            Thêm ghi chú
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <Field>
            <FieldLabel htmlFor="loan-note" className="sr-only">
              Ghi chú
            </FieldLabel>
            <Textarea
              id="loan-note"
              name="note"
              placeholder="Thêm ghi chú cho giao dịch vay nợ..."
            />
          </Field>
        </CollapsibleContent>
      </Collapsible>
    </FieldGroup>
  )
}
