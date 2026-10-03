"use client"

import * as React from "react"

import { AccountSelectGroups } from "@/components/account-select-groups"
import { CurrencyInput } from "@/components/forms/currency-input"
import { RequiredMark } from "@/components/forms/required-mark"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { TransactionFieldProps } from "../form-types"
import { NeedAccountState } from "../need-account-state"
import { useTransactionHistory } from "../transaction-history-context"

function AccountSelect({
  accounts,
  excludedAccountId,
  id,
  invalid,
  name,
  onValueChange,
  value,
}: {
  accounts: TransactionFieldProps["accounts"]
  excludedAccountId?: string
  id: string
  invalid: boolean
  name: string
  onValueChange: (value: string) => void
  value: string
}) {
  const availableAccounts = accounts
    .filter((account) => account.status === "active" || account.id === value)
    .filter((account) => account.id !== excludedAccountId)

  return (
    <Select name={name} value={value} onValueChange={onValueChange} required>
      <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
        <SelectValue placeholder="Chọn tài khoản" />
      </SelectTrigger>
      <SelectContent>
        <AccountSelectGroups accounts={availableAccounts} />
      </SelectContent>
    </Select>
  )
}

/** A transfer needs two accounts it can use: active ones, or those of the transfer being edited. */
export function canTransfer(
  accounts: TransactionFieldProps["accounts"],
  defaultValues?: TransactionFieldProps["defaultValues"],
) {
  return accounts.filter(
    (account) =>
      account.status === "active" ||
      account.id === defaultValues?.fromAccountId ||
      account.id === defaultValues?.toAccountId,
  ).length >= 2
}

/** The two accounts of a transfer, then its fee, which is seldom set. */
export function TransferFields({
  accounts,
  defaultValues,
  errors,
  onFieldChange,
}: TransactionFieldProps) {
  const history = useTransactionHistory("transfer", defaultValues?.id)
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

  if (!canTransfer(accounts, defaultValues)) {
    return (
      <NeedAccountState
        title="Cần ít nhất 2 tài khoản"
        description="Thêm một tài khoản nữa để chuyển tiền."
      />
    )
  }

  return (
    <>
      <Field data-invalid={Boolean(errors.fromAccountId) || undefined}>
        <FieldLabel htmlFor="transfer-from-account">
          Từ tài khoản <RequiredMark />
        </FieldLabel>
        <AccountSelect
          accounts={accounts}
          excludedAccountId={toAccountId}
          id="transfer-from-account"
          invalid={Boolean(errors.fromAccountId)}
          name="fromAccountId"
          onValueChange={(value) => {
            setFromAccountId(value)
            onFieldChange("fromAccountId")
          }}
          value={fromAccountId}
        />
        {errors.fromAccountId ? <FieldError>{errors.fromAccountId}</FieldError> : null}
      </Field>
      <Field data-invalid={Boolean(errors.toAccountId) || undefined}>
        <FieldLabel htmlFor="transfer-to-account">
          Đến tài khoản <RequiredMark />
        </FieldLabel>
        <AccountSelect
          accounts={accounts}
          excludedAccountId={fromAccountId}
          id="transfer-to-account"
          invalid={Boolean(errors.toAccountId)}
          name="toAccountId"
          onValueChange={(value) => {
            setToAccountId(value)
            onFieldChange("toAccountId")
          }}
          value={toAccountId}
        />
        {errors.toAccountId ? <FieldError>{errors.toAccountId}</FieldError> : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="transfer-fee">Phí chuyển</FieldLabel>
        <CurrencyInput
          key={`${defaultValues?.id ?? "new"}-transfer-fee`}
          id="transfer-fee"
          name="fee"
          defaultValue={defaultValues?.fee}
        />
      </Field>
    </>
  )
}
