"use client"

import * as React from "react"
import { ImagePlusIcon } from "lucide-react"
import { toast } from "sonner"

import { AccountSelectGroups } from "@/components/account-select-groups"
import { AmountSuggestions, useAmountQuickPick } from "@/components/forms/amount-suggestions"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getLocalDateTime } from "@/lib/date-time"

import type { TransactionFieldProps } from "../form-types"
import { useTransactionHistory } from "../transaction-history-context"

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
  const availableAccounts = accounts
    .filter((account) => account.status === "active" || account.id === value)
    .filter((account) => account.id !== excludedAccountId)

  return (
    <Select name={name} value={value} onValueChange={onValueChange} required>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Chọn tài khoản" />
      </SelectTrigger>
      <SelectContent>
        <AccountSelectGroups accounts={availableAccounts} />
      </SelectContent>
    </Select>
  )
}

export function TransferFields({
  accounts,
  defaultValues,
  isCreating,
}: TransactionFieldProps) {
  const history = useTransactionHistory("transfer", defaultValues?.id)
  const historyAmounts = React.useMemo(
    () => history.map((transaction) => Math.abs(transaction.amount)),
    [history],
  )
  const amountPick = useAmountQuickPick(defaultValues?.amount ?? null, historyAmounts)
  // New transfers start from the account used most recently as the source.
  const lastUsedFromAccountId = defaultValues
    ? undefined
    : history.find((transaction) =>
        accounts.some(
          (account) =>
            account.status === "active" && account.id === transaction.fromAccountId,
        ),
      )?.fromAccountId
  const [fromAccountId, setFromAccountId] = React.useState(
    defaultValues?.fromAccountId ?? lastUsedFromAccountId ?? "",
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
      <Field>
        <FieldLabel htmlFor="transfer-amount">Số tiền</FieldLabel>
        <CurrencyInput
          id="transfer-amount"
          name="amount"
          value={amountPick.amount}
          onValueChange={amountPick.onType}
          required
        />
        <AmountSuggestions
          suggestions={amountPick.suggestions}
          value={amountPick.amount}
          onSelect={amountPick.onPick}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="transfer-fee">
          Phí chuyển {!isCreating ? <Badge variant="outline">Tùy chọn</Badge> : null}
        </FieldLabel>
        <CurrencyInput
          key={`${defaultValues?.id ?? "new"}-transfer-fee`}
          id="transfer-fee"
          name="fee"
          defaultValue={defaultValues?.fee}
        />
      </Field>

      <div className="grid gap-4">
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
          <FieldLabel htmlFor="transfer-to-account">
            Đến tài khoản
          </FieldLabel>
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

      <Field>
        <FieldLabel htmlFor="transfer-note">
          Ghi chú {!isCreating ? <Badge variant="outline">Tùy chọn</Badge> : null}
        </FieldLabel>
        <Textarea
          id="transfer-note"
          name="note"
          defaultValue={defaultValues?.note}
          placeholder="Thêm ghi chú cho giao dịch chuyển khoản..."
        />
      </Field>

      {!isCreating ? (
        <Field>
          <FieldLabel>Biên lai chuyển khoản</FieldLabel>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              toast.info("Đính kèm biên lai sẽ được hỗ trợ trong bản cập nhật tới.")
            }
          >
            <ImagePlusIcon />
            Đính kèm
            <Badge variant="secondary">Sắp có</Badge>
          </Button>
        </Field>
      ) : null}
    </FieldGroup>
  )
}
