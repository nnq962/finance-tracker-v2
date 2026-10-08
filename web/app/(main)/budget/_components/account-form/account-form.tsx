"use client"

import * as React from "react"
import { SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AccountActionResult, AccountFormValues, AccountType } from "@/lib/accounts/types"
import { getCurrentLocalDateTime, getLocalDateTime } from "@/lib/date-time"
import { toDateKey } from "@/lib/format-date"
import { getInstitutionsByType } from "@/lib/institutions"
import { randomId } from "@/lib/random-id"
import { scrollIntoViewWithin } from "@/lib/scroll-into-view"
import { cn } from "@/lib/utils"

import { InstitutionGrid, InstitutionPicker } from "./institution-fields"

const accountTypeOptions = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e-wallet", label: "Ví điện tử" },
] as const

/** A cash account is named for what it is until the user names it. */
const CASH_NAME = "Tiền mặt"

type FieldName = "balance" | "institutionId" | "name" | "openedAt"

/** Where each field's error sends the focus, in the order they appear. */
const fieldOrder: FieldName[] = ["balance", "institutionId", "name", "openedAt"]

const fieldElementId: Record<FieldName, string> = {
  balance: "account-balance",
  institutionId: "account-institution",
  name: "account-name",
  openedAt: "account-date-row",
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

/**
 * An account laid out as the transaction sheet is: its type as a segmented
 * control at the top, the balance large under it with its suggestions, for a
 * bank or wallet a grid of the common logos (all of them, searchable, on a
 * deeper screen), then rows for its name (taken from the bank until typed),
 * whether the balance is below zero, when it starts and a note. Missing fields
 * are pointed out where they are before sending.
 */
export function AccountForm({
  action,
  defaultValues,
  expectedBalance,
  onSuccess,
  submitLabel = "Lưu tài khoản",
  successMessage,
}: AccountFormProps) {
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  // A new account keeps one request id across retries, so it is added once.
  const [requestId, setRequestId] = React.useState(() => randomId())
  const [accountType, setAccountType] = React.useState<AccountType>(defaultValues?.type ?? "cash")
  const [institutionId, setInstitutionId] = React.useState(defaultValues?.institutionId ?? "")
  const [name, setName] = React.useState(defaultValues?.name ?? CASH_NAME)
  // Named by the user, so picking a bank or switching type leaves it alone.
  const [nameEdited, setNameEdited] = React.useState(Boolean(defaultValues?.name))
  // The amount is typed without a sign; the switch puts it below zero.
  const [balance, setBalance] = React.useState<number | null>(
    defaultValues?.balance === undefined ? null : Math.abs(defaultValues.balance),
  )
  const [balanceNegative, setBalanceNegative] = React.useState((defaultValues?.balance ?? 0) < 0)
  // A new account starts now; an edited one keeps its date.
  const [when, setWhen] = React.useState(() =>
    defaultValues?.openedAt ? getLocalDateTime(defaultValues.openedAt) : getCurrentLocalDateTime(),
  )
  const today = toDateKey(new Date())

  const institutions = accountType === "cash" ? null : getInstitutionsByType(accountType)
  const institutionLabel = accountType === "bank" ? "Ngân hàng" : "Ví điện tử"

  const [errors, setErrors] = React.useState<Partial<Record<FieldName, string>>>({})
  const clearError = (field: FieldName) =>
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })

  // The whole list of banks or wallets, as a deeper screen of the sheet.
  const [picking, setPicking] = React.useState(false)
  const back = () => setPicking(false)
  usePageSheetScreen(picking && institutions ? { title: `Chọn ${institutionLabel.toLowerCase()}`, onBack: back } : null)

  const pickInstitution = (id: string) => {
    setInstitutionId(id)
    clearError("institutionId")
    // Named after its bank or wallet until the user types a name of their own.
    const institution = institutions?.find((item) => item.id === id)
    if (institution && !nameEdited) {
      setName(institution.shortName ?? institution.name)
      clearError("name")
    }
  }

  // The note as tall as what it holds.
  const noteRef = React.useRef<HTMLTextAreaElement>(null)
  const fitNote = (area: HTMLTextAreaElement) => {
    area.style.height = "auto"
    area.style.height = `${area.scrollHeight}px`
  }
  React.useLayoutEffect(() => {
    if (noteRef.current) fitNote(noteRef.current)
  }, [])

  return (
    <form
      noValidate
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        const found: typeof errors = {}
        if (balance === null) found.balance = "Nhập số dư."
        if (institutions && !institutionId) found.institutionId = `Chọn ${institutionLabel.toLowerCase()}.`
        if (!name.trim()) found.name = "Nhập tên tài khoản."
        if (!/^\d{4}-\d{2}-\d{2}$/.test(when.date) || !when.time) found.openedAt = "Chọn ngày và giờ."
        else if (when.date > today) found.openedAt = "Không thể chọn ngày sau hôm nay."
        else if (when.date < "2000-01-01") found.openedAt = "Chọn ngày từ năm 2000 trở đi."
        setErrors(found)
        const first = fieldOrder.find((field) => found[field])
        if (first) {
          const element = document.getElementById(fieldElementId[first])
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
      <input type="hidden" name="type" value={accountType} />
      <input type="hidden" name="institutionId" value={institutions ? institutionId : ""} />
      {expectedBalance === undefined ? null : <input type="hidden" name="expectedBalance" value={expectedBalance} />}

      {/* The deeper screen; the first stays mounted under it, so nothing typed is lost. */}
      {picking && institutions ? (
        <InstitutionPicker
          kind={accountType === "bank" ? "bank" : "e-wallet"}
          institutions={institutions}
          value={institutionId}
          onPick={(id) => {
            pickInstitution(id)
            back()
          }}
        />
      ) : null}

      <div className={cn("flex flex-col gap-6 pb-4", picking && "hidden")}>
        <Tabs
          value={accountType}
          onValueChange={(value) => {
            const type = value as AccountType
            setAccountType(type)
            setInstitutionId("")
            if (!nameEdited) setName(type === "cash" ? CASH_NAME : "")
            clearError("institutionId")
            clearError("name")
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

        <div className="flex flex-col items-center gap-2">
          <FieldLabel htmlFor="account-balance" className="text-xs font-normal text-muted-foreground">
            {expectedBalance === undefined ? "Số dư ban đầu" : "Số dư hiện tại"}
          </FieldLabel>
          <CurrencyInput
            variant="hero"
            id="account-balance"
            name="balance"
            value={balance}
            onValueChange={(value) => {
              setBalance(value)
              clearError("balance")
            }}
            negative={balanceNegative}
            onNegativeChange={setBalanceNegative}
            invalid={Boolean(errors.balance)}
            required
          />
          {errors.balance ? <FieldError className="text-center">{errors.balance}</FieldError> : null}
        </div>

        {institutions ? (
          <InstitutionGrid
            id="account-institution"
            caption={institutionLabel}
            institutions={institutions}
            value={institutionId}
            onValueChange={pickInstitution}
            onShowAll={() => setPicking(true)}
            error={errors.institutionId}
          />
        ) : null}

        <div className="flex flex-col gap-2">
          <SettingsGroup>
            {/* The name typed in place, at the row's end, as iOS settings do. */}
            <li className={cn("flex min-h-16 items-center gap-3 px-4 py-3", settingsSeparatorClassName())}>
              <label htmlFor="account-name" className={cn("shrink-0 text-sm font-medium", errors.name && "text-destructive")}>
                Tên
              </label>
              <input
                id="account-name"
                name="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameEdited(event.target.value.trim().length > 0)
                  clearError("name")
                }}
                placeholder="Tên tài khoản"
                autoComplete="off"
                maxLength={80}
                required
                aria-invalid={Boolean(errors.name) || undefined}
                className="min-w-0 flex-1 bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground"
              />
            </li>
            <SettingsRow
              title="Số dư âm"
              description="Đang nợ, thấu chi"
              action={
                <Switch
                  aria-label="Số dư âm"
                  checked={balanceNegative}
                  onCheckedChange={setBalanceNegative}
                />
              }
            />
            <TimeRows
              idPrefix="account"
              title="Bắt đầu từ"
              quickDays={false}
              date={when.date}
              time={when.time}
              today={today}
              onDateChange={(date) => {
                setWhen((current) => ({ ...current, date }))
                clearError("openedAt")
              }}
              onTimeChange={(time) => {
                setWhen((current) => ({ ...current, time }))
                clearError("openedAt")
              }}
              invalid={Boolean(errors.openedAt)}
            />
            {/* The note typed in place, as tall as a row of the list (64) and growing with what is written. */}
            <li className={cn("flex min-h-16 items-center px-4 py-3", settingsSeparatorClassName())}>
              <label htmlFor="account-note" className="sr-only">
                Ghi chú
              </label>
              <textarea
                ref={noteRef}
                id="account-note"
                name="note"
                rows={1}
                defaultValue={defaultValues?.note}
                placeholder="Ghi chú (tuỳ chọn)"
                onInput={(event) => fitNote(event.currentTarget)}
                className="block min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </li>
          </SettingsGroup>
          {errors.name || errors.openedAt ? (
            <FieldError className="px-4">{errors.name ?? errors.openedAt}</FieldError>
          ) : null}
        </div>
      </div>

      {picking ? null : (
        <PageSheetFooter>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          {/* Back is in the header, so the footer only saves. */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Spinner /> : <SaveIcon />}
            {isPending ? "Đang lưu..." : submitLabel}
          </Button>
        </PageSheetFooter>
      )}
    </form>
  )
}
