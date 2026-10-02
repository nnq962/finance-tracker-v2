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
import { toast } from "sonner"

import { AmountSuggestions, useAmountQuickPick } from "@/components/forms/amount-suggestions"
import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import { SheetFooter } from "@/components/ui/sheet"
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

const NO_HISTORY: number[] = []

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
  /** Set when editing: the balance the form opened with, sent so the server
   * only overwrites the balance when the user changed it. */
  expectedBalance?: number
  onSuccess: () => void
  submitLabel?: string
  successMessage: string
}

export function AccountForm({
  action,
  defaultValues,
  expectedBalance,
  onSuccess,
  submitLabel = "Lưu tài khoản",
  successMessage,
}: AccountFormProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const institutionAnchor = useComboboxAnchor()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [accountType, setAccountType] = React.useState<AccountType>(
    defaultValues?.type ?? "cash",
  )
  const [institutionId, setInstitutionId] = React.useState(
    defaultValues?.institutionId ?? "",
  )
  const [name, setName] = React.useState(defaultValues?.name ?? "")
  const [nameEdited, setNameEdited] = React.useState(Boolean(defaultValues?.name))
  const balancePick = useAmountQuickPick(defaultValues?.balance ?? null, NO_HISTORY)
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
          try {
            const result = await action(formData)

            if (result.success) {
              toast.success(successMessage)
              onSuccess()
              router.refresh()
              return
            }

            setErrorMessage(result.error)
            toast.error(result.error)
          } catch {
            const message = "Không thể lưu tài khoản. Vui lòng thử lại."
            setErrorMessage(message)
            toast.error(message)
          }
        })
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
        <FieldGroup>
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
                  if (!nameEdited) setName("")
                }
              }}
              className="grid w-full grid-cols-3"
              aria-label="Chọn loại tài khoản"
            >
              {accountTypeOptions.map(({ value, label, icon: Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  className="w-full"
                >
                  <Icon />
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          {institutionOptions && (
            <Field>
              <FieldLabel htmlFor="account-institution">
                {institutionLabel}
              </FieldLabel>
              <Combobox
                key={accountType}
                items={institutionOptions}
                name="institutionId"
                value={selectedInstitution ?? null}
                onValueChange={(institution) => {
                  setInstitutionId(institution?.id ?? "")
                  // Name the account after its institution until the
                  // user types a name of their own.
                  if (institution && !nameEdited) {
                    setName(institution.shortName ?? institution.name)
                  }
                }}
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
                <div ref={institutionAnchor} className="w-full">
                  <ComboboxInput
                    id="account-institution"
                    className="w-full"
                    placeholder="Tìm kiếm"
                    autoComplete="off"
                  >
                    {selectedInstitution ? (
                      <InputGroupAddon align="inline-start">
                        <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
                          <Image
                            src={selectedInstitution.logoPath}
                            alt=""
                            width={16}
                            height={16}
                            className="size-full object-contain"
                          />
                        </span>
                      </InputGroupAddon>
                    ) : null}
                  </ComboboxInput>
                </div>
                <ComboboxContent
                  anchor={institutionAnchor}
                  portalContainer={formRef}
                >
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
          <Field>
            <FieldLabel htmlFor="account-name">Tên tài khoản</FieldLabel>
            <Input
              id="account-name"
              name="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameEdited(event.target.value.trim().length > 0)
              }}
              placeholder="Ví dụ: Lương, Tiết kiệm"
              autoComplete="off"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-balance">
              {expectedBalance === undefined ? "Số dư ban đầu" : "Số dư hiện tại"}
            </FieldLabel>
            {expectedBalance === undefined ? null : (
              <input type="hidden" name="expectedBalance" value={expectedBalance} />
            )}
            <CurrencyInput
              id="account-balance"
              name="balance"
              value={balancePick.amount}
              onValueChange={balancePick.onType}
              required
            />
            <AmountSuggestions
              suggestions={balancePick.suggestions}
              value={balancePick.amount}
              onSelect={balancePick.onPick}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="account-note">Ghi chú</FieldLabel>
            <Textarea
              id="account-note"
              name="note"
              defaultValue={defaultValues?.note}
            />
          </Field>

        </FieldGroup>
      </div>

      <SheetFooter>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        {/* Back is in the header, so the footer only saves. */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isPending ? "Đang lưu..." : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}
