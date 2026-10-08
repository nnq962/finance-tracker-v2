"use client"

import * as React from "react"
import Image from "next/image"
import {
  SaveIcon,
} from "lucide-react"
import { toast } from "sonner"

import { FormSection } from "@/components/app/form-section"
import { PageSheetFooter } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { RequiredMark } from "@/components/forms/required-mark"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import type {
  AccountActionResult,
  AccountFormValues,
  AccountType,
} from "@/lib/accounts/types"
import { getLocalDateTime } from "@/lib/date-time"
import { toDateKey } from "@/lib/format-date"
import { scrollIntoViewWithin } from "@/lib/scroll-into-view"
import { randomId } from "@/lib/random-id"
import {
  getInstitutionsByType,
  type FinancialInstitution,
} from "@/lib/institutions"


const accountTypeOptions = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e-wallet", label: "Ví điện tử" },
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
  const formRef = React.useRef<HTMLFormElement>(null)
  const institutionAnchor = useComboboxAnchor()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  // A new account keeps one request id across retries, so it is added once.
  const [requestId, setRequestId] = React.useState(() => randomId())
  const [accountType, setAccountType] = React.useState<AccountType>(
    defaultValues?.type ?? "cash",
  )
  const [institutionId, setInstitutionId] = React.useState(
    defaultValues?.institutionId ?? "",
  )
  const [name, setName] = React.useState(defaultValues?.name ?? "")
  const [nameEdited, setNameEdited] = React.useState(Boolean(defaultValues?.name))
  // The amount is typed without a sign; the input's +/− button puts it below zero.
  const [balance, setBalance] = React.useState<number | null>(
    defaultValues?.balance === undefined ? null : Math.abs(defaultValues.balance),
  )
  const [balanceNegative, setBalanceNegative] = React.useState(
    (defaultValues?.balance ?? 0) < 0,
  )
  const institutionOptions =
    accountType === "cash" ? null : getInstitutionsByType(accountType)
  const institutionLabel =
    accountType === "bank" ? "Ngân hàng" : "Ví điện tử"
  const selectedInstitution = institutionOptions?.find(
    (institution) => institution.id === institutionId,
  )
  // A new account starts now; an edited one keeps its date.
  const defaultOpenedAt = defaultValues?.openedAt ? getLocalDateTime(defaultValues.openedAt) : undefined
  // Missing fields, named under each one before anything is sent.
  const [errors, setErrors] = React.useState<Partial<Record<"institutionId" | "name" | "balance" | "openedAt", string>>>({})
  const clearError = (field: keyof typeof errors) =>
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })

  return (
    <form
      ref={formRef}
      noValidate
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        const found: typeof errors = {}
        if (institutionOptions && !institutionId) found.institutionId = `Chọn ${institutionLabel.toLowerCase()}.`
        if (!name.trim()) found.name = "Nhập tên tài khoản."
        if (balance === null) found.balance = "Nhập số dư."
        const date = String(formData.get("date") ?? "")
        if (!date || !formData.get("time")) found.openedAt = "Chọn ngày và giờ."
        else if (date > toDateKey(new Date())) found.openedAt = "Không thể chọn ngày sau hôm nay."
        else if (date < "2000-01-01") found.openedAt = "Chọn ngày từ năm 2000 trở đi."
        setErrors(found)
        const first = (["institutionId", "name", "balance", "openedAt"] as const).find((field) => found[field])
        if (first) {
          const element = document.getElementById(
            {
              institutionId: "account-institution",
              name: "account-name",
              balance: "account-balance",
              openedAt: "account-opened-date",
            }[first],
          )
          element?.focus({ preventScroll: true })
          if (element) scrollIntoViewWithin(element)
          return
        }

        startTransition(async () => {
          try {
            const result = await action(formData)

            if (result.success) {
              toast.success(successMessage)
              setRequestId(randomId())
              onSuccess()
              return
            }

            setErrorMessage(result.error)
          } catch {
            setErrorMessage("Không thể lưu tài khoản. Vui lòng thử lại.")
          }
        })
      }}
    >
      {!defaultValues ? <input type="hidden" name="requestId" value={requestId} /> : null}
      <div className="pb-4">
        <FormSection>
          <FieldGroup>
            {/* Tabs, as for a transaction's kind. */}
            <input type="hidden" name="type" value={accountType} />
            <Tabs
              value={accountType}
              onValueChange={(value) => {
                setAccountType(value as AccountType)
                setInstitutionId("")
                if (!nameEdited) setName("")
                clearError("institutionId")
              }}
              className="w-full"
            >
              <TabsList className="w-full" aria-label="Loại tài khoản">
                {accountTypeOptions.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {institutionOptions && (
              <Field data-invalid={Boolean(errors.institutionId) || undefined}>
                <FieldLabel htmlFor="account-institution">
                  {institutionLabel} <RequiredMark />
                </FieldLabel>
                <Combobox
                  key={accountType}
                  items={institutionOptions}
                  name="institutionId"
                  value={selectedInstitution ?? null}
                  onValueChange={(institution) => {
                    setInstitutionId(institution?.id ?? "")
                    clearError("institutionId")
                    if (institution && !nameEdited) clearError("name")
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
                      aria-invalid={Boolean(errors.institutionId) || undefined}
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
                {errors.institutionId ? <FieldError>{errors.institutionId}</FieldError> : null}
              </Field>
            )}
            <Field data-invalid={Boolean(errors.name) || undefined}>
              <FieldLabel htmlFor="account-name">
                Tên tài khoản <RequiredMark />
              </FieldLabel>
              <Input
                id="account-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameEdited(event.target.value.trim().length > 0)
                  clearError("name")
                }}
                autoComplete="off"
                required
                aria-invalid={Boolean(errors.name) || undefined}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.balance) || undefined}>
              <FieldLabel htmlFor="account-balance">
                {expectedBalance === undefined ? "Số dư ban đầu" : "Số dư hiện tại"} <RequiredMark />
              </FieldLabel>
              {expectedBalance === undefined ? null : (
                <input type="hidden" name="expectedBalance" value={expectedBalance} />
              )}
              <CurrencyInput
                id="account-balance"
                name="balance"
                value={balance}
                onValueChange={(value) => {
                  setBalance(value)
                  clearError("balance")
                }}
                invalid={Boolean(errors.balance)}
                negative={balanceNegative}
                onNegativeChange={setBalanceNegative}
                required
              />
              {errors.balance ? <FieldError>{errors.balance}</FieldError> : null}
            </Field>

            <DateTimeFields
              idPrefix="account-opened"
              label={<>Thời gian tạo <RequiredMark /></>}
              // As for transactions: 2000 through today (Vietnam time).
              minDate="2000-01-01"
              maxDate={toDateKey(new Date())}
              defaultDate={defaultOpenedAt?.date}
              defaultTime={defaultOpenedAt?.time}
              onDateChange={() => clearError("openedAt")}
              onTimeChange={() => clearError("openedAt")}
              error={errors.openedAt}
              required
            />

            <Field>
              <FieldLabel htmlFor="account-note">Ghi chú</FieldLabel>
              <Textarea
                id="account-note"
                name="note"
                defaultValue={defaultValues?.note}
              />
            </Field>

          </FieldGroup>
        </FormSection>
      </div>

      <PageSheetFooter>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        {/* Back is in the header, so the footer only saves. */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <Spinner />
          ) : (
            <SaveIcon />
          )}
          {isPending ? "Đang lưu..." : submitLabel}
        </Button>
      </PageSheetFooter>
    </form>
  )
}
