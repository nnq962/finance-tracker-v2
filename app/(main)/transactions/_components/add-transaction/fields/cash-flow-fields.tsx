"use client"

import * as React from "react"
import {
  ImagePlusIcon,
  LandmarkIcon,
  PaperclipIcon,
  ReceiptTextIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { AccountSelectGroups } from "@/components/account-select-groups"
import { AmountSuggestions, useAmountQuickPick } from "@/components/forms/amount-suggestions"
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getLocalDateTime } from "@/lib/date-time"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import type { TransactionFieldProps } from "../form-types"
import { useTransactionHistory } from "../transaction-history-context"

const MAX_SUGGESTED_CATEGORIES = 3

type CashFlowFieldsProps = TransactionFieldProps & {
  idPrefix: "expense" | "income"
  notePlaceholder: string
}

export function CashFlowFields({
  accounts,
  categoryGroups,
  defaultValues,
  idPrefix,
  isCreating,
  notePlaceholder,
  onManageCategories,
}: CashFlowFieldsProps) {
  const availableAccounts = accounts.filter(
    (account) =>
      account.status === "active" || account.id === defaultValues?.accountId,
  )
  const availableGroups = categoryGroups.filter(
    (group) => group.type === idPrefix && group.items.length > 0,
  )
  const history = useTransactionHistory(idPrefix, defaultValues?.id)
  // New entries start on the account used most recently for this kind.
  const lastUsedAccountId = defaultValues
    ? undefined
    : history.find((transaction) =>
        availableAccounts.some((account) => account.id === transaction.accountId),
      )?.accountId
  const availableItems = availableGroups.flatMap((group) => group.items)
  // Most used categories first, topped up with the catalog order.
  const usageByCategory = new Map<string, number>()
  for (const transaction of history) {
    if (!transaction.categoryId) continue
    usageByCategory.set(
      transaction.categoryId,
      (usageByCategory.get(transaction.categoryId) ?? 0) + 1,
    )
  }
  const suggestedCategories = [...availableItems]
    .sort(
      (left, right) =>
        (usageByCategory.get(right.id) ?? 0) - (usageByCategory.get(left.id) ?? 0),
    )
    .slice(0, MAX_SUGGESTED_CATEGORIES)
  const [categoryId, setCategoryId] = React.useState(
    defaultValues?.categoryId ?? "",
  )
  const historyAmounts = React.useMemo(
    () => history.map((transaction) => Math.abs(transaction.amount)),
    [history],
  )
  const amountPick = useAmountQuickPick(
    defaultValues ? Math.abs(defaultValues.amount) : null,
    historyAmounts,
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
      <Card>
        <CardHeader>
          <CardTitle>Số tiền</CardTitle>
          {!isCreating ? (
            <>
              <CardDescription>Nhập số tiền theo đơn vị Việt Nam đồng.</CardDescription>
              <CardAction>
                <Badge variant="secondary">VND</Badge>
              </CardAction>
            </>
          ) : null}
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-amount`} className="sr-only">
              Số tiền
            </FieldLabel>
            <CurrencyInput
              id={`${idPrefix}-amount`}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LandmarkIcon className="size-4" />
            Thông tin giao dịch
          </CardTitle>
          {!isCreating ? (
            <CardDescription>
              Chọn nguồn tiền, hạng mục và thời điểm phát sinh.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor={`${idPrefix}-account`}>
                  Tài khoản
                </FieldLabel>
                <Select
                  name="accountId"
                  defaultValue={defaultValues?.accountId ?? lastUsedAccountId}
                  required
                >
                  <SelectTrigger id={`${idPrefix}-account`} className="w-full">
                    <SelectValue placeholder="Chọn tài khoản" />
                  </SelectTrigger>
                  <SelectContent>
                    <AccountSelectGroups accounts={availableAccounts} />
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor={`${idPrefix}-category`}>
                    Hạng mục
                  </FieldLabel>
                  {onManageCategories ? (
                    <Button type="button" variant="ghost" onClick={onManageCategories}>
                      Quản lý hạng mục
                    </Button>
                  ) : null}
                </div>
                <Select
                  name="categoryId"
                  value={categoryId}
                  onValueChange={setCategoryId}
                  required
                >
                  <SelectTrigger id={`${idPrefix}-category`} className="w-full">
                    <SelectValue placeholder="Chọn hạng mục" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    showScrollButtons={false}
                    className="max-h-[min(16rem,var(--radix-select-content-available-height))]"
                  >
                    {defaultCategoryIsMissing && defaultValues?.categoryId ? (
                      <SelectGroup>
                        <SelectLabel>
                          {defaultValues.categoryGroupName ??
                            "Hạng mục đã ngừng sử dụng"}
                        </SelectLabel>
                        <SelectItem value={defaultValues.categoryId}>
                          <ReceiptTextIcon />
                          {defaultValues.categoryName ?? "Hạng mục cũ"}
                        </SelectItem>
                      </SelectGroup>
                    ) : null}
                    {availableGroups.map((group) => (
                      <SelectGroup key={group.id}>
                        <SelectLabel>{group.name}</SelectLabel>
                        {group.items.map((item) => {
                          const ItemIcon = categoryIconRegistry[item.iconName]

                          return (
                            <SelectItem key={item.id} value={item.id}>
                              <ItemIcon />
                              {item.name}
                            </SelectItem>
                          )
                        })}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {suggestedCategories.length > 0 ? (
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <SparklesIcon className="size-4" />
                  Chọn nhanh
                </FieldLabel>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={
                    suggestedCategories.some((item) => item.id === categoryId)
                      ? categoryId
                      : ""
                  }
                  onValueChange={(value) => {
                    if (value) setCategoryId(value)
                  }}
                  className="flex-wrap"
                  aria-label="Chọn nhanh hạng mục"
                >
                  {suggestedCategories.map((item) => {
                    const ItemIcon = categoryIconRegistry[item.iconName]

                    return (
                      <ToggleGroupItem
                        key={item.id}
                        value={item.id}
                        aria-label={`Chọn hạng mục ${item.name}`}
                      >
                        <ItemIcon />
                        {item.name}
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>
              </Field>
            ) : null}

            <DateTimeFields
              idPrefix={idPrefix}
              defaultDate={defaultDateTime?.date}
              defaultTime={defaultDateTime?.time}
              required
            />

            <Field>
              <FieldLabel htmlFor={`${idPrefix}-note`}>
                Ghi chú {!isCreating ? <Badge variant="outline">Tùy chọn</Badge> : null}
              </FieldLabel>
              <Textarea
                id={`${idPrefix}-note`}
                name="note"
                defaultValue={defaultValues?.note}
                placeholder={notePlaceholder}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {!isCreating ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <PaperclipIcon className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Hóa đơn</p>
                <p className="text-xs text-muted-foreground">
                  Lưu ảnh để đối chiếu giao dịch sau này.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info("Đính kèm hóa đơn sẽ được hỗ trợ trong bản cập nhật tới.")
              }
            >
              <ImagePlusIcon />
              Đính kèm
              <Badge variant="secondary">Sắp có</Badge>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </FieldGroup>
  )
}
