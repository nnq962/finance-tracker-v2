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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getLocalDateTime } from "@/lib/date-time"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

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
  const suggestedCategories = availableGroups
    .flatMap((group) => group.items)
    .slice(0, 3)
  const [categoryId, setCategoryId] = React.useState(
    defaultValues?.categoryId ?? "",
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
          <CardTitle>Số tiền giao dịch</CardTitle>
          <CardDescription>Nhập số tiền theo đơn vị Việt Nam đồng.</CardDescription>
          <CardAction>
            <Badge variant="secondary">VND</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-amount`} className="sr-only">
              Số tiền
            </FieldLabel>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LandmarkIcon className="size-4" />
            Thông tin giao dịch
          </CardTitle>
          <CardDescription>
            Chọn nguồn tiền, hạng mục và thời điểm phát sinh.
          </CardDescription>
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
              </Field>

              <Field>
                <FieldLabel htmlFor={`${idPrefix}-category`}>
                  Hạng mục
                </FieldLabel>
                <Select
                  name="categoryId"
                  value={categoryId}
                  onValueChange={setCategoryId}
                  required
                >
                  <SelectTrigger id={`${idPrefix}-category`} className="w-full">
                    <SelectValue placeholder="Chọn hạng mục" />
                  </SelectTrigger>
                  <SelectContent>
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
                <div className="flex flex-wrap gap-2">
                  {suggestedCategories.map((item) => {
                    const ItemIcon = categoryIconRegistry[item.iconName]

                    return (
                      <Button
                        key={item.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCategoryId(item.id)}
                      >
                        <ItemIcon />
                        {item.name}
                      </Button>
                    )
                  })}
                </div>
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
                Ghi chú <Badge variant="outline">Tùy chọn</Badge>
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
    </FieldGroup>
  )
}
