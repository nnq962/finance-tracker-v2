"use client"

import * as React from "react"
import { PlusIcon, SaveIcon } from "lucide-react"

import { FormSection } from "@/components/app/form-section"
import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { AccountSelectGroups } from "@/components/account-select-groups"
import { DatePreview } from "@/components/forms/date-preview"
import { CurrencyInput } from "@/components/forms/currency-input"
import { RequiredMark } from "@/components/forms/required-mark"
import { useFieldErrors } from "@/components/forms/use-field-errors"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Account } from "@/lib/accounts/types"
import { actionErrorMessage } from "@/lib/stale-deploy"
import { getInterest, todayDate } from "../_lib/debt-payments"
import { formatDebtDate } from "../_lib/debt-presentation"
import { formatCurrency } from "@/lib/format-currency"

import type {
  Contact,
  Debt,
  DebtDirection,
  DebtRecordingMode,
  InterestPeriod,
  NewContact,
  NewDebt,
} from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"


const directionOptions = [
  { value: "lent", label: "Cho vay" },
  { value: "borrowed", label: "Đi vay" },
] satisfies Array<{ value: DebtDirection; label: string }>

type DebtField = "contactId" | "amount" | "accountId" | "recordedAt" | "dueAt" | "interestRate"
const fieldOrder: DebtField[] = ["contactId", "amount", "accountId", "recordedAt", "dueAt", "interestRate"]
const fieldIds: Record<DebtField, string> = {
  contactId: "debt-contact",
  amount: "debt-amount",
  accountId: "debt-account",
  recordedAt: "debt-recorded-at",
  dueAt: "debt-due-at",
  interestRate: "debt-interest-rate",
}

type AddDebtSheetProps = {
  debt?: Debt
  trigger?: React.ReactNode
  accounts: Account[]
  contacts: Contact[]
  onAddDebt: (debt: NewDebt) => Promise<void>
  /** Lets the form add a person on the spot; the new contact is then selected. */
  onAddContact?: (contact: NewContact) => Promise<Contact>
  /** Controlled mode (no trigger), e.g. opened from an actions menu. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

export function AddDebtSheet({
  debt,
  trigger,
  accounts,
  contacts,
  onAddDebt,
  onAddContact,
  open: controlledOpen,
  onOpenChange,
  returnFocusRef,
}: AddDebtSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [direction, setDirection] = React.useState<DebtDirection>(debt?.direction ?? "lent")
  const [recordingMode, setRecordingMode] = React.useState<DebtRecordingMode>(debt?.recordingMode ?? "cash-flow")
  const isOpening = recordingMode === "opening"
  const [hasInterest, setHasInterest] = React.useState(debt?.hasInterest ?? false)
  const [amount, setAmount] = React.useState<number | null>(debt?.amount ?? null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [wasOpen, setWasOpen] = React.useState(open)
  const [contactId, setContactId] = React.useState(debt?.contactId ?? "")
  // For the written-out dates under the date inputs.
  const [recordedAt, setRecordedAt] = React.useState(debt?.recordedAt ?? todayDate())
  const [dueAt, setDueAt] = React.useState(debt?.dueAt ?? "")
  const [addingContact, setAddingContact] = React.useState(false)
  const { errors, clear, report, reset: resetErrors } = useFieldErrors<DebtField>()
  // Tracked for the preview of principal plus interest.
  const [interestRate, setInterestRate] = React.useState(debt?.interestRate?.toString() ?? "")
  const [interestPeriod, setInterestPeriod] = React.useState<InterestPeriod>(debt?.interestPeriod ?? "month")

  // A controlled open never passes through onOpenChange, so reset the form
  // fields here whenever the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setErrorMessage(null)
      resetErrors()
      setDirection(debt?.direction ?? "lent")
      setRecordingMode(debt?.recordingMode ?? "cash-flow")
      setHasInterest(debt?.hasInterest ?? false)
      setContactId(debt?.contactId ?? "")
      setRecordedAt(debt?.recordedAt ?? todayDate())
      setDueAt(debt?.dueAt ?? "")
      setInterestRate(debt?.interestRate?.toString() ?? "")
      setInterestPeriod(debt?.interestPeriod ?? "month")
      setAmount(debt?.amount ?? null)
    }
  }
  const [pending, setPending] = React.useState(false)
  const submitting = React.useRef(false)
  const today = React.useMemo(() => todayDate(), [])
  const accountLabel =
    direction === "lent" ? "Nguồn tiền" : "Tài khoản nhận tiền"
  const activeAccounts = accounts.filter((account) => account.status === "active" || account.id === debt?.accountId)
  const isDisabled = contacts.length === 0 && !onAddContact

  return (
    <>
      <PageSheet
        title={debt ? "Sửa khoản nợ" : "Thêm khoản nợ"}
        disabled={pending}
        open={open}
        onOpenChange={(nextOpen) => {
          if (submitting.current) return
          if (nextOpen) setErrorMessage(null)
          setOpen(nextOpen)
        }}
        trigger={controlledOpen === undefined ? (
          trigger ?? <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={isDisabled}
            title={
              contacts.length === 0
                ? "Thêm người liên quan trước khi tạo khoản nợ"
                : undefined
            }
          >
            <PlusIcon />
            Thêm khoản nợ
          </Button>
        ) : undefined}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault()
            returnFocusRef.current.focus()
          }
        }}
      >
        {/* Tabs, as for a transaction's kind; fixed once payments exist. */}
        <div className="space-y-2 pb-4">
          <Tabs
            value={direction}
            onValueChange={(value) => setDirection(value as DebtDirection)}
            className="w-full"
          >
            <TabsList className="w-full" aria-label="Loại khoản nợ">
              {directionOptions.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  disabled={pending || Boolean(debt?.payments?.length)}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {debt?.payments?.length ? (
            <FieldDescription>Đã có thanh toán nên không đổi được loại.</FieldDescription>
          ) : null}
        </div>

        <form
          noValidate
          className="flex flex-1 flex-col"
          aria-busy={pending}
          onSubmit={async (event) => {
            event.preventDefault()
            if (submitting.current) return
            const form = event.currentTarget
            const formData = new FormData(form)
            setErrorMessage(null)

            const found: Partial<Record<DebtField, string>> = {}
            if (!contactId) found.contactId = "Chọn người liên quan."
            if (!(amount && amount > 0)) found.amount = "Nhập số tiền."
            if (!isOpening && !formData.get("accountId")) found.accountId = "Chọn tài khoản."
            const recorded = String(formData.get("recordedAt") || "")
            if (!recorded) found.recordedAt = "Chọn ngày."
            else if (recorded > today) found.recordedAt = "Không thể chọn ngày sau hôm nay."
            const due = String(formData.get("dueAt") || "")
            if (due && recorded && due < recorded) found.dueAt = "Hẹn trả phải từ ngày ghi trở đi."
            if (hasInterest) {
              const rate = Number(String(formData.get("interestRate") || "").replace(",", "."))
              if (!(rate > 0 && rate <= 100)) found.interestRate = "Nhập lãi suất từ 0 đến 100%."
            }
            if (report(found, fieldOrder, (name) => fieldIds[name])) return

            submitting.current = true
            setPending(true)
            setErrorMessage(null)
            try {
              await onAddDebt({
                recordingMode,
                accountId: isOpening ? undefined : String(formData.get("accountId")),
                contactId: String(formData.get("contactId")),
                direction,
                amount: Number(formData.get("amount")),
                paidAmount: 0,
                hasInterest,
                interestRate: hasInterest
                  ? Number(
                      String(formData.get("interestRate")).replace(",", "."),
                    )
                  : undefined,
                interestPeriod: hasInterest
                  ? (String(
                      formData.get("interestPeriod"),
                    ) as InterestPeriod)
                  : undefined,
                note: String(formData.get("note")),
                recordedAt: String(formData.get("recordedAt")),
                dueAt: String(formData.get("dueAt") || "") || undefined,
              })
              form.reset()
              setDirection("lent")
              setHasInterest(false)
              setContactId("")
              setOpen(false)
            } catch (error) {
              setErrorMessage(actionErrorMessage(error, "Không thể lưu khoản nợ."))
            } finally {
              submitting.current = false
              setPending(false)
            }
          }}
        >
          <fieldset disabled={pending} className="min-w-0 pb-4">
            <FormSection>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="debt-recording-mode">Cách ghi nhận</FieldLabel>
                  <Select value={recordingMode} onValueChange={(value) => setRecordingMode(value as DebtRecordingMode)} disabled={pending || Boolean(debt)}>
                    <SelectTrigger id="debt-recording-mode" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="cash-flow">Phát sinh khoản vay mới</SelectItem>
                        <SelectItem value="opening">Ghi nhận nợ có sẵn</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {isOpening ? "Không thay đổi số dư tài khoản." : "Cập nhật số dư tài khoản đã chọn."}
                  </FieldDescription>
                  {!isOpening && activeAccounts.length === 0 ? <FieldError>Thêm tài khoản trước, hoặc chọn ghi nhận nợ có sẵn.</FieldError> : null}
                </Field>

                <Field data-invalid={Boolean(errors.contactId) || undefined}>
                  <div className="flex items-center justify-between gap-2">
                    <FieldLabel htmlFor="debt-contact">
                      Người liên quan <RequiredMark />
                    </FieldLabel>
                    {onAddContact ? (
                      <Button type="button" variant="ghost" size="xs" onClick={() => setAddingContact(true)}>
                        <PlusIcon />
                        Người mới
                      </Button>
                    ) : null}
                  </div>
                  <Select
                    value={contactId}
                    onValueChange={(value) => {
                      setContactId(value)
                      clear("contactId")
                    }}
                    name="contactId"
                    required
                    // An empty list would open as a stray box in the corner; add a person instead.
                    disabled={pending || contacts.length === 0}
                  >
                    <SelectTrigger id="debt-contact" className="w-full" aria-invalid={Boolean(errors.contactId) || undefined}>
                      <SelectValue placeholder={contacts.length === 0 ? "Chưa có người liên hệ" : "Chọn từ danh bạ"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Danh bạ</SelectLabel>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.contactId ? <FieldError>{errors.contactId}</FieldError> : null}
                </Field>

                <Field data-invalid={Boolean(errors.amount) || undefined}>
                  <FieldLabel htmlFor="debt-amount">
                    {isOpening ? "Tiền gốc còn nợ" : "Số tiền"} <RequiredMark />
                  </FieldLabel>
                  <CurrencyInput
                    id="debt-amount"
                    name="amount"
                    value={amount}
                    onValueChange={(value) => {
                      setAmount(value)
                      clear("amount")
                    }}
                    invalid={Boolean(errors.amount)}
                    required
                  />
                  {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}
                </Field>

                {!isOpening && <Field data-invalid={Boolean(errors.accountId) || undefined}>
                  <FieldLabel htmlFor="debt-account">
                    {accountLabel} <RequiredMark />
                  </FieldLabel>
                  <Select
                    defaultValue={debt?.accountId}
                    name="accountId"
                    required
                    disabled={pending || activeAccounts.length === 0}
                    onValueChange={() => clear("accountId")}
                  >
                    <SelectTrigger id="debt-account" className="w-full" aria-invalid={Boolean(errors.accountId) || undefined}>
                      <SelectValue placeholder="Chọn tài khoản" />
                    </SelectTrigger>
                    <SelectContent>
                      <AccountSelectGroups accounts={activeAccounts} />
                    </SelectContent>
                  </Select>
                  {errors.accountId ? <FieldError>{errors.accountId}</FieldError> : null}
                </Field>}

                <Field>
                  <FieldLabel htmlFor="debt-note">Ghi chú</FieldLabel>
                  <Textarea
                    id="debt-note"
                    name="note"
                    defaultValue={debt?.note}
                    maxLength={500}
                  />
                </Field>

                <FieldSeparator>Điều khoản</FieldSeparator>
                <div className="grid min-w-0 w-full gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Field className="min-w-0" data-invalid={Boolean(errors.recordedAt) || undefined}>
                    <FieldLabel htmlFor="debt-recorded-at">
                      {isOpening ? "Ngày bắt đầu theo dõi" : "Ngày ghi"} <RequiredMark />
                    </FieldLabel>
                    <div className="flex min-w-0">
                      <Input
                        id="debt-recorded-at"
                        name="recordedAt"
                        type="date"
                        defaultValue={debt?.recordedAt ?? today}
                        onChange={(event) => {
                          setRecordedAt(event.target.value)
                          clear("recordedAt")
                          clear("dueAt")
                        }}
                        required
                        aria-invalid={Boolean(errors.recordedAt) || undefined}
                        className="w-auto min-w-0 max-w-full flex-1"
                      />
                    </div>
                    <DatePreview date={recordedAt} />
                    {errors.recordedAt ? <FieldError>{errors.recordedAt}</FieldError> : null}
                  </Field>
                  <Field className="min-w-0" data-invalid={Boolean(errors.dueAt) || undefined}>
                    <FieldLabel htmlFor="debt-due-at">
                      Hẹn trả
                    </FieldLabel>
                    <div className="flex min-w-0">
                      <Input
                        id="debt-due-at"
                        name="dueAt"
                        type="date"
                        defaultValue={debt?.dueAt}
                        onChange={(event) => {
                          setDueAt(event.target.value)
                          clear("dueAt")
                        }}
                        aria-invalid={Boolean(errors.dueAt) || undefined}
                        className="w-auto min-w-0 max-w-full flex-1"
                      />
                    </div>
                    {dueAt ? <DatePreview date={dueAt} /> : null}
                    {errors.dueAt ? <FieldError>{errors.dueAt}</FieldError> : null}
                  </Field>
                </div>

                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="debt-has-interest">
                      Có tính lãi
                    </FieldLabel>
                    {isOpening ? (
                      <FieldDescription>Tính từ ngày bắt đầu theo dõi.</FieldDescription>
                    ) : null}
                  </FieldContent>
                  <Switch
                    disabled={pending}
                    id="debt-has-interest"
                    checked={hasInterest}
                    onCheckedChange={setHasInterest}
                  />
                </Field>

                {hasInterest ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={Boolean(errors.interestRate) || undefined}>
                      <FieldLabel htmlFor="debt-interest-rate">
                        Lãi suất <RequiredMark />
                      </FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="debt-interest-rate"
                          name="interestRate"
                          defaultValue={debt?.interestRate}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]+([.,][0-9]{1,2})?"
                          placeholder="0"
                          required
                          aria-invalid={Boolean(errors.interestRate) || undefined}
                          onInput={(event) => {
                            setInterestRate(event.currentTarget.value)
                            clear("interestRate")
                          }}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>%</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      {errors.interestRate ? <FieldError>{errors.interestRate}</FieldError> : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="debt-interest-period">
                        Chu kỳ
                      </FieldLabel>
                      <Select
                        disabled={pending}
                        name="interestPeriod"
                        value={interestPeriod}
                        onValueChange={(value) => setInterestPeriod(value as InterestPeriod)}
                        required
                      >
                        <SelectTrigger
                          id="debt-interest-period"
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Chu kỳ tính lãi</SelectLabel>
                            <SelectItem value="month">Mỗi tháng</SelectItem>
                            <SelectItem value="year">Mỗi năm</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                ) : null}
                {hasInterest ? (
                  <InterestPreview
                    amount={amount}
                    rate={Number(interestRate.replace(",", "."))}
                    period={interestPeriod}
                    recordedAt={recordedAt}
                    dueAt={dueAt}
                  />
                ) : null}
              </FieldGroup>
            </FormSection>
          </fieldset>

          <PageSheetFooter>
            {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            <Button type="submit" className="w-full" disabled={pending || (!isOpening && activeAccounts.length === 0)}>
              <SaveIcon />
              {pending ? "Đang lưu…" : "Lưu khoản nợ"}
            </Button>
          </PageSheetFooter>
        </form>
      </PageSheet>
      {/* Stacked over this sheet; the new person is picked once saved. */}
      {onAddContact ? (
        <AddContactSheet
          open={addingContact}
          onOpenChange={setAddingContact}
          onAddContact={async (values) => setContactId((await onAddContact(values)).id)}
        />
      ) : null}
    </>
  )
}

/**
 * Principal plus interest on the due date, as the form is filled in, or
 * what a month or year adds when there is no due date.
 */
function InterestPreview({
  amount,
  rate,
  period,
  recordedAt,
  dueAt,
}: {
  amount: number | null
  rate: number
  period: InterestPeriod
  recordedAt: string
  dueAt: string
}) {
  if (!amount || !(rate > 0 && rate <= 100)) return null
  const periodInterest = Math.round((amount * rate) / 100)

  if (!dueAt || !recordedAt || dueAt < recordedAt) {
    return (
      <p className="text-sm text-muted-foreground">
        Lãi mỗi {period === "year" ? "năm" : "tháng"}:{" "}
        <span className="font-medium text-foreground tabular-nums">{formatCurrency(periodInterest)}</span>
      </p>
    )
  }

  const { days, interestAmount, totalAmount } = getInterest(
    { amount, hasInterest: true, interestRate: rate, interestPeriod: period, recordedAt } as Debt,
    dueAt,
  )
  return (
    <p className="text-sm text-muted-foreground">
      Đến hạn {formatDebtDate(dueAt)} ({days} ngày): gốc {formatCurrency(amount)} + lãi{" "}
      {formatCurrency(interestAmount)} ={" "}
      <span className="font-medium text-foreground tabular-nums">{formatCurrency(totalAmount)}</span>
    </p>
  )
}
