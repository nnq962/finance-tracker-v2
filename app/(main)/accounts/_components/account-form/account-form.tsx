"use client"

import * as React from "react"
import Image from "next/image"
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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
  getInstitutionsByType,
  type FinancialInstitution,
} from "@/lib/institutions"

const accountTypeOptions = [
  { value: "cash", label: "Tiền mặt", icon: BanknoteIcon },
  { value: "bank", label: "Ngân hàng", icon: LandmarkIcon },
  { value: "e-wallet", label: "Ví điện tử", icon: WalletCardsIcon },
] as const

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi-VN")
}

function matchesInstitution(institution: FinancialInstitution, query: string) {
  const searchableText = [
    institution.shortName,
    institution.name,
    institution.id,
    ...(institution.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")

  return normalizeSearchText(searchableText).includes(normalizeSearchText(query))
}

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
  const formRef = React.useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [accountType, setAccountType] = React.useState<AccountType>(
    defaultValues?.type ?? "cash",
  )
  const [institutionId, setInstitutionId] = React.useState(
    defaultValues?.institutionId ?? "",
  )
  const institutionOptions =
    accountType === "cash" ? null : getInstitutionsByType(accountType)
  const institutionLabel =
    accountType === "bank" ? "Ngân hàng" : "Ví điện tử"
  const selectedInstitution = institutionOptions?.find(
    (institution) => institution.id === institutionId,
  )

  return (
    <form
      ref={formRef}
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
                if (value) {
                  setAccountType(value as AccountType)
                  setInstitutionId("")
                }
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

          {institutionOptions && (
            <Field>
              <FieldLabel htmlFor="account-institution">
                Chọn {institutionLabel.toLowerCase()}
              </FieldLabel>
              <Combobox
                key={accountType}
                items={institutionOptions}
                name="institutionId"
                value={selectedInstitution ?? null}
                onValueChange={(institution) =>
                  setInstitutionId(institution?.id ?? "")
                }
                itemToStringLabel={(institution) =>
                  institution.shortName ?? institution.name
                }
                itemToStringValue={(institution) => institution.id}
                isItemEqualToValue={(institution, value) =>
                  institution.id === value.id
                }
                filter={matchesInstitution}
                autoHighlight
                required
              >
                <ComboboxInput
                  id="account-institution"
                  className="w-full"
                  placeholder={`Tìm và chọn ${institutionLabel.toLowerCase()}`}
                  autoComplete="off"
                />
                <ComboboxContent portalContainer={formRef}>
                  <ComboboxEmpty>
                    Không tìm thấy {institutionLabel.toLowerCase()}.
                  </ComboboxEmpty>
                  <ComboboxList>
                    {(institution) => (
                      <ComboboxItem
                        key={institution.id}
                        value={institution}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white p-1">
                          <Image
                            src={institution.logoPath}
                            alt=""
                            width={20}
                            height={20}
                            className="size-full object-contain"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {institution.shortName ?? institution.name}
                          </span>
                          {institution.shortName &&
                          institution.shortName !== institution.name ? (
                            <span className="block truncate text-xs text-muted-foreground">
                              {institution.name}
                            </span>
                          ) : null}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
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
