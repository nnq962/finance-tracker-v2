"use client"

import * as React from "react"
import { ImagePlusIcon, PaperclipIcon } from "lucide-react"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  const availableAccounts = accounts
    .filter((account) => account.status === "active" || account.id === value)
    .filter((account) => account.id !== excludedAccountId)

  return (
    <Select name={name} value={value} onValueChange={onValueChange} required>
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
      <Card>
        <CardHeader>
          <CardTitle>Giá trị chuyển khoản</CardTitle>
          <CardDescription>Nhập số tiền và phí phát sinh nếu có.</CardDescription>
          <CardAction>
            <Badge variant="secondary">VND</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4">
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
            <FieldLabel htmlFor="transfer-fee">
              Phí chuyển <Badge variant="outline">Tùy chọn</Badge>
            </FieldLabel>
            <CurrencyInput
              key={`${defaultValues?.id ?? "new"}-transfer-fee`}
              id="transfer-fee"
              name="fee"
              defaultValue={defaultValues?.fee}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Luồng tiền
          </CardTitle>
          <CardDescription>
            Chọn tài khoản gửi, tài khoản nhận và thời gian chuyển.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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
                Ghi chú <Badge variant="outline">Tùy chọn</Badge>
              </FieldLabel>
              <Textarea
                id="transfer-note"
                name="note"
                defaultValue={defaultValues?.note}
                placeholder="Thêm ghi chú cho giao dịch chuyển khoản..."
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <PaperclipIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Biên lai chuyển khoản</p>
              <p className="text-xs text-muted-foreground">
                Đính kèm ảnh để tiện đối chiếu sau này.
              </p>
            </div>
          </div>
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
        </CardContent>
      </Card>
    </FieldGroup>
  )
}
