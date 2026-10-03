"use client"

import * as React from "react"
import { ReceiptTextIcon, Settings2Icon } from "lucide-react"

import { AccountSelectGroups } from "@/components/account-select-groups"
import { RequiredMark } from "@/components/forms/required-mark"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import type { TransactionFieldProps } from "../form-types"
import { useTransactionHistory } from "../transaction-history-context"

const MAX_SUGGESTED_CATEGORIES = 3

type CashFlowFieldsProps = TransactionFieldProps & {
  kind: "expense" | "income"
}

/** The account and category of an expense or an income. */
export function CashFlowFields({
  accounts,
  categoryGroups,
  defaultValues,
  errors,
  kind,
  onFieldChange,
  onManageCategories,
}: CashFlowFieldsProps) {
  const availableAccounts = accounts.filter(
    (account) =>
      account.status === "active" || account.id === defaultValues?.accountId,
  )
  const availableGroups = categoryGroups.filter(
    (group) => group.type === kind && group.items.length > 0,
  )
  const history = useTransactionHistory(kind, defaultValues?.id)
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
  const chooseCategory = (value: string) => {
    setCategoryId(value)
    onFieldChange("categoryId")
  }
  const defaultCategoryIsMissing =
    Boolean(defaultValues?.categoryId) &&
    !availableGroups.some((group) =>
      group.items.some((item) => item.id === defaultValues?.categoryId),
    )

  return (
    <>
      <Field data-invalid={Boolean(errors.accountId) || undefined}>
        <FieldLabel htmlFor={`${kind}-account`}>
          Tài khoản <RequiredMark />
        </FieldLabel>
        <Select
          name="accountId"
          defaultValue={defaultValues?.accountId ?? lastUsedAccountId}
          onValueChange={() => onFieldChange("accountId")}
          required
          // Editing with every account archived: an empty list would open as a stray box.
          disabled={availableAccounts.length === 0}
        >
          <SelectTrigger
            id={`${kind}-account`}
            className="w-full"
            aria-invalid={Boolean(errors.accountId) || undefined}
          >
            <SelectValue placeholder={availableAccounts.length === 0 ? "Chưa có tài khoản" : "Chọn tài khoản"} />
          </SelectTrigger>
          <SelectContent>
            <AccountSelectGroups accounts={availableAccounts} />
          </SelectContent>
        </Select>
        {errors.accountId ? <FieldError>{errors.accountId}</FieldError> : null}
      </Field>

      <Field data-invalid={Boolean(errors.categoryId) || undefined}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={`${kind}-category`}>
            Hạng mục <RequiredMark />
          </FieldLabel>
          {onManageCategories ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Quản lý hạng mục"
              onClick={onManageCategories}
            >
              <Settings2Icon />
            </Button>
          ) : null}
        </div>
        {/* The most used categories, one tap away; the list below holds them all. */}
        {suggestedCategories.length > 0 ? (
          <ToggleGroup
            type="single"
            size="sm"
            value={
              suggestedCategories.some((item) => item.id === categoryId)
                ? categoryId
                : ""
            }
            onValueChange={(value) => {
              if (value) chooseCategory(value)
            }}
            className="flex-wrap"
            aria-label="Hạng mục hay dùng"
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
        ) : null}
        {availableGroups.length === 0 && !defaultCategoryIsMissing ? (
          <p className="text-sm text-muted-foreground">Chưa có hạng mục</p>
        ) : (
          <Select
            name="categoryId"
            value={categoryId}
            onValueChange={chooseCategory}
            required
          >
            <SelectTrigger
              id={`${kind}-category`}
              className="w-full"
              aria-invalid={Boolean(errors.categoryId) || undefined}
            >
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
        )}
        {errors.categoryId ? <FieldError>{errors.categoryId}</FieldError> : null}
      </Field>
    </>
  )
}
