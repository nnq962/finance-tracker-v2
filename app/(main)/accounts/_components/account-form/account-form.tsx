"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BanknoteIcon,
  LandmarkIcon,
  LoaderCircleIcon,
  SaveIcon,
  WalletCardsIcon,
} from "lucide-react"

import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SheetFooter } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type {
  AccountActionResult,
  AccountFormValues,
  AccountType,
} from "@/lib/accounts/types"

import {
  bankOptions,
  eWalletOptions,
} from "../../_data/account-form-options"

const accountTypeOptions = [
  { value: "cash", label: "Tiền mặt", icon: BanknoteIcon },
  { value: "bank", label: "Ngân hàng", icon: LandmarkIcon },
  { value: "e-wallet", label: "Ví điện tử", icon: WalletCardsIcon },
] as const

type AccountFormProps = {
  action: (formData: FormData) => Promise<AccountActionResult>
  defaultValues?: Partial<AccountFormValues>
  onSuccess: () => void
  showBalance?: boolean
  submitLabel?: string
}

export function AccountForm({
  action,
  defaultValues,
  onSuccess,
  showBalance = true,
  submitLabel = "Lưu tài khoản",
}: AccountFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [accountType, setAccountType] = React.useState<AccountType>(
    defaultValues?.type ?? "cash",
  )
  const providerOptions =
    accountType === "bank"
      ? bankOptions
      : accountType === "e-wallet"
        ? eWalletOptions
        : null
  const providerLabel = accountType === "bank" ? "Ngân hàng" : "Ví điện tử"
  const defaultProvider = providerOptions?.includes(defaultValues?.provider ?? "")
    ? defaultValues?.provider
    : undefined

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        startTransition(async () => {
          const result = await action(formData)

          if (result.success) {
            onSuccess()
            router.refresh()
            return
          }

          setErrorMessage(result.error)
        })
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="account-name">Tên tài khoản</FieldLabel>
            <Input
              id="account-name"
              name="name"
              defaultValue={defaultValues?.name}
              placeholder="Tiền mặt, Ngân hàng A, Ví điện tử B..."
              autoComplete="off"
              required
            />
          </Field>

          <Field>
            <FieldLabel>Loại tài khoản</FieldLabel>
            <input type="hidden" name="type" value={accountType} />
            <ToggleGroup
              type="single"
              variant="outline"
              value={accountType}
              onValueChange={(value) => {
                if (value) setAccountType(value as AccountType)
              }}
              className="grid w-full grid-cols-3"
              aria-label="Chọn loại tài khoản"
            >
              {accountTypeOptions.map(({ value, label, icon: Icon }) => (
                <ToggleGroupItem key={value} value={value} className="w-full">
                  <Icon />
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          {providerOptions && (
            <Field>
              <FieldLabel htmlFor="account-provider">
                Chọn {providerLabel.toLowerCase()}
              </FieldLabel>
              <Select
                key={accountType}
                name="provider"
                defaultValue={defaultProvider}
                required
              >
                <SelectTrigger id="account-provider" className="w-full">
                  <SelectValue placeholder={`Chọn ${providerLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          {showBalance && (
            <Field>
              <FieldLabel htmlFor="account-balance">Số dư ban đầu</FieldLabel>
              <CurrencyInput
                id="account-balance"
                name="balance"
                defaultValue={defaultValues?.balance}
                required
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="account-note">Ghi chú</FieldLabel>
            <Textarea
              id="account-note"
              name="note"
              defaultValue={defaultValues?.note}
              placeholder="Thêm ghi chú cho tài khoản..."
            />
          </Field>

          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="account-exclude-from-reports">
                Không tính vào báo cáo
              </FieldLabel>
              <FieldDescription>
                Số dư và giao dịch của tài khoản này sẽ không ảnh hưởng đến báo cáo.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="account-exclude-from-reports"
              name="excludeFromReports"
              defaultChecked={defaultValues?.excludeFromReports}
            />
          </Field>
        </FieldGroup>
      </div>

      <SheetFooter>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon />}
          {isPending ? "Đang lưu..." : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}
