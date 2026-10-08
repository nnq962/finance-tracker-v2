"use client"

import * as React from "react"
import { ChevronDownIcon, PlusIcon, SaveIcon, Trash2Icon, UserPlusIcon, UsersIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Collapse } from "@/components/app/collapse"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { gridChoices, PickGrid } from "@/components/app/pick-grid"
import { CurrencyInput } from "@/components/forms/currency-input"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate } from "@/lib/format-date"
import { scrollIntoViewWithin } from "@/lib/scroll-into-view"
import { actionErrorMessage } from "@/lib/stale-deploy"
import { cn } from "@/lib/utils"

import { AccountPicker } from "../../transactions/_components/add-transaction/fields/account-fields"
import { getInterest, todayDate } from "../_lib/debt-payments"
import type { Contact, Debt, DebtDirection, InterestPeriod, NewContact, NewDebt } from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"
import { ContactAvatar } from "./contact-avatar"
import { ContactPicker } from "./contact-picker"

const directionOptions = [
  { value: "lent", label: "Cho vay" },
  { value: "borrowed", label: "Đi vay" },
] satisfies Array<{ value: DebtDirection; label: string }>

type DebtField = "amount" | "contactId" | "accountId" | "recordedAt" | "dueAt" | "interestRate"
const fieldOrder: DebtField[] = ["amount", "contactId", "accountId", "recordedAt", "dueAt", "interestRate"]
const fieldIds: Record<DebtField, string> = {
  amount: "debt-amount",
  contactId: "debt-contact",
  accountId: "debt-account",
  recordedAt: "debt-recorded-at-date-row",
  dueAt: "debt-due-row",
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
  /** A new debt's person, chosen ahead: opened from that person's screen in the contacts. */
  defaultContactId?: string
  /** The people debts were last recorded with, latest first: they lead the grid. */
  recentContactIds?: string[]
  /** When editing: a round delete button beside saving (with an undo). */
  onDelete?: () => void
  /** Controlled mode (no trigger), e.g. opened from an actions menu. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

/**
 * A debt added or edited, laid out as the transaction sheet is: which way
 * as a segmented control, the amount large with its suggestions, the person
 * as a grid of the latest (all of them, searchable, on a deeper screen), then
 * rows for the account the money left or went into, when, when it is due and
 * a note, and switches for a debt owed from before and for interest.
 */
export function AddDebtSheet({
  debt,
  trigger,
  open: controlledOpen,
  onOpenChange,
  returnFocusRef,
  ...formProps
}: AddDebtSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [pending, setPending] = React.useState(false)

  return (
    <PageSheet
      title={debt ? "Sửa khoản nợ" : "Khoản nợ mới"}
      disabled={pending}
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return
        setOpen(nextOpen)
      }}
      trigger={
        controlledOpen === undefined
          ? (trigger ?? (
              <Button type="button" className="w-full sm:w-auto">
                <PlusIcon />
                Thêm khoản nợ
              </Button>
            ))
          : undefined
      }
      onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}
    >
      {/* Inside the sheet, so its lists open as deeper screens; it starts over each time the sheet opens. */}
      <DebtForm {...formProps} debt={debt} pending={pending} onPendingChange={setPending} onDone={() => setOpen(false)} />
    </PageSheet>
  )
}

/** The date key `months` after `dateKey`, the day kept where the month has it (31/01 + 1 → 28/02). */
function addMonths(dateKey: string, months: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const last = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate()
  return new Date(Date.UTC(year, month - 1 + months, Math.min(day, last))).toISOString().slice(0, 10)
}

/**
 * When a debt is due, as rows of a group: "Hẹn trả … Không hẹn", folding out
 * a month, three or six after it was lent (or none), and the phone's own date
 * picker.
 */
function DueRows({
  value,
  from,
  onChange,
  invalid,
}: {
  /** "YYYY-MM-DD", or "" for none. */
  value: string
  /** The day it was lent or borrowed: the earliest due date, and what the chips count from. */
  from: string
  onChange: (value: string) => void
  invalid: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const choices = [1, 3, 6].map((months) => ({ key: addMonths(from, months), label: `${months} tháng` }))

  return (
    <>
      <SettingsRow
        id="debt-due-row"
        title="Hẹn trả"
        value={
          <span className={cn("flex items-center gap-1", value && "text-foreground", invalid && "text-destructive")}>
            {value ? formatDate(value) : "Không hẹn"}
            <ChevronDownIcon
              aria-hidden="true"
              className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")}
            />
          </span>
        }
        chevron={false}
        expanded={open}
        onClick={() => setOpen((current) => !current)}
      />
      {/* No divider: it belongs to the row above; 8px above and below, inside the fold. */}
      <li className="px-4">
        <Collapse open={open}>
          <div className="flex flex-col gap-2 py-2">
            <ToggleGroup
              type="single"
              size="sm"
              className="flex-wrap"
              value={choices.some((choice) => choice.key === value) ? value : ""}
              onValueChange={(next) => {
                if (next) onChange(next)
              }}
              aria-label="Chọn nhanh hạn trả"
            >
              {choices.map((choice) => (
                <ToggleGroupItem key={choice.label} value={choice.key}>
                  {choice.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex items-center gap-2">
              <Input
                id="debt-due-at"
                aria-label="Ngày hẹn trả"
                type="date"
                value={value}
                min={from}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={invalid || undefined}
                className="flex-1"
              />
              {value ? (
                <Button type="button" variant="ghost" onClick={() => onChange("")}>
                  Bỏ hẹn
                </Button>
              ) : null}
            </div>
          </div>
        </Collapse>
      </li>
    </>
  )
}

/** What interest comes to: by the due date when there is one, else a period's worth. */
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

  if (!dueAt || dueAt < recordedAt) {
    return (
      <SettingsRow
        title={`Lãi mỗi ${period === "year" ? "năm" : "tháng"}`}
        value={formatCurrency(Math.round((amount * rate) / 100), { signDisplay: "never" })}
      />
    )
  }

  const { days, interestAmount, totalAmount } = getInterest(
    { amount, hasInterest: true, interestRate: rate, interestPeriod: period, recordedAt } as Debt,
    dueAt,
  )
  return (
    <SettingsRow
      title={`Đến hạn ${formatDate(dueAt)}`}
      description={`Gốc + lãi ${formatCurrency(interestAmount, { signDisplay: "never" })} (${days} ngày)`}
      value={<span className="font-medium text-foreground">{formatCurrency(totalAmount, { signDisplay: "never" })}</span>}
    />
  )
}

function DebtForm({
  debt,
  accounts,
  contacts,
  onAddDebt,
  onAddContact,
  defaultContactId,
  recentContactIds = [],
  onDelete,
  pending,
  onPendingChange,
  onDone,
}: Omit<AddDebtSheetProps, "trigger" | "open" | "onOpenChange" | "returnFocusRef"> & {
  pending: boolean
  onPendingChange: (pending: boolean) => void
  onDone: () => void
}) {
  const today = React.useMemo(() => todayDate(), [])
  const [direction, setDirection] = React.useState<DebtDirection>(debt?.direction ?? "lent")
  const [isOpening, setIsOpening] = React.useState((debt?.recordingMode ?? "cash-flow") === "opening")
  const [amount, setAmount] = React.useState<number | null>(debt?.amount ?? null)
  const [contactId, setContactId] = React.useState(debt?.contactId ?? defaultContactId ?? "")
  const [accountId, setAccountId] = React.useState(debt?.accountId ?? "")
  const [recordedAt, setRecordedAt] = React.useState(debt?.recordedAt ?? today)
  const [dueAt, setDueAt] = React.useState(debt?.dueAt ?? "")
  const [hasInterest, setHasInterest] = React.useState(debt?.hasInterest ?? false)
  const [interestRate, setInterestRate] = React.useState(debt?.interestRate?.toString() ?? "")
  const [interestPeriod, setInterestPeriod] = React.useState<InterestPeriod>(debt?.interestPeriod ?? "month")
  const [errors, setErrors] = React.useState<Partial<Record<DebtField, string>>>({})
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [addingContact, setAddingContact] = React.useState(false)
  const submitting = React.useRef(false)
  const noteRef = React.useRef<HTMLTextAreaElement>(null)
  const clear = (field: DebtField) =>
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })

  const lent = direction === "lent"
  const lockedDirection = Boolean(debt?.payments?.length)
  const activeAccounts = accounts.filter((account) => account.status === "active" || account.id === debt?.accountId)
  const account = activeAccounts.find((item) => item.id === accountId)

  // The latest people first, then the rest by name; the chosen one always shows.
  const ordered = [
    ...recentContactIds.map((id) => contacts.find((contact) => contact.id === id)).filter((contact): contact is Contact => Boolean(contact)),
    ...contacts.filter((contact) => !recentContactIds.includes(contact.id)).sort((left, right) => left.name.localeCompare(right.name, "vi")),
  ]

  const [screen, setScreen] = React.useState<"contact" | "account" | null>(null)
  const back = () => setScreen(null)
  usePageSheetScreen(screen ? { title: screen === "contact" ? "Chọn người" : lent ? "Tiền ra từ" : "Tiền vào", onBack: back } : null)

  const fitNote = (area: HTMLTextAreaElement) => {
    area.style.height = "auto"
    area.style.height = `${area.scrollHeight}px`
  }
  React.useLayoutEffect(() => {
    if (noteRef.current) fitNote(noteRef.current)
  }, [])

  const rate = Number(interestRate.replace(",", "."))

  return (
    <>
      <form
        noValidate
        className="flex flex-1 flex-col"
        aria-busy={pending}
        onSubmit={async (event) => {
          event.preventDefault()
          if (submitting.current) return
          setErrorMessage(null)

          const found: Partial<Record<DebtField, string>> = {}
          if (!(amount && amount > 0)) found.amount = "Nhập số tiền."
          if (!contactId) found.contactId = lent ? "Chọn người vay." : "Chọn người cho vay."
          if (!isOpening && !account) found.accountId = "Chọn tài khoản."
          if (!/^\d{4}-\d{2}-\d{2}$/.test(recordedAt)) found.recordedAt = "Chọn ngày."
          else if (recordedAt > today) found.recordedAt = "Không thể chọn ngày sau hôm nay."
          if (dueAt && dueAt < recordedAt) found.dueAt = "Hẹn trả phải từ ngày vay trở đi."
          if (hasInterest && !(rate > 0 && rate <= 100)) found.interestRate = "Nhập lãi suất từ 0 đến 100%."
          setErrors(found)
          const first = fieldOrder.find((field) => found[field])
          if (first) {
            const element = document.getElementById(fieldIds[first])
            element?.focus({ preventScroll: true })
            if (element) scrollIntoViewWithin(element)
            return
          }

          submitting.current = true
          onPendingChange(true)
          try {
            await onAddDebt({
              recordingMode: isOpening ? "opening" : "cash-flow",
              accountId: isOpening ? undefined : accountId,
              contactId,
              direction,
              amount: amount ?? 0,
              paidAmount: 0,
              hasInterest,
              interestRate: hasInterest ? rate : undefined,
              interestPeriod: hasInterest ? interestPeriod : undefined,
              note: noteRef.current?.value.trim() ?? "",
              recordedAt,
              dueAt: dueAt || undefined,
            })
            onDone()
          } catch (error) {
            setErrorMessage(actionErrorMessage(error, "Không thể lưu khoản nợ."))
          } finally {
            submitting.current = false
            onPendingChange(false)
          }
        }}
      >
        {/* The deeper screens; the first stays mounted under them, so nothing typed is lost. */}
        {screen === "contact" ? (
          <ContactPicker
            contacts={contacts}
            value={contactId}
            onPick={(id) => {
              setContactId(id)
              clear("contactId")
              back()
            }}
            onAdd={onAddContact ? () => setAddingContact(true) : undefined}
          />
        ) : null}
        {screen === "account" ? (
          <AccountPicker
            accounts={activeAccounts}
            value={accountId}
            onPick={(id) => {
              setAccountId(id)
              clear("accountId")
              back()
            }}
          />
        ) : null}

        <fieldset disabled={pending} className={cn("flex min-w-0 flex-col gap-6 pb-4", screen && "hidden")}>
          <div className="flex flex-col gap-2">
            <Tabs value={direction} onValueChange={(value) => setDirection(value as DebtDirection)} className="w-full">
              <TabsList className="w-full" aria-label="Loại khoản nợ">
                {directionOptions.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value} disabled={pending || lockedDirection}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {lockedDirection ? (
              <p className="px-4 text-xs text-muted-foreground">Đã có lần thu hoặc trả nên không đổi được loại.</p>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-2">
            <FieldLabel htmlFor="debt-amount" className="text-xs font-normal text-muted-foreground">
              {isOpening ? "Tiền gốc còn nợ" : lent ? "Số tiền cho vay" : "Số tiền đi vay"}
            </FieldLabel>
            <CurrencyInput
              variant="hero"
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
            {errors.amount ? <FieldError className="text-center">{errors.amount}</FieldError> : null}
          </div>

          <PickGrid
            id="debt-contact"
            caption={lent ? "Cho ai vay" : "Vay của ai"}
            items={gridChoices(ordered, contactId, 0, 3).map((contact) => ({
              id: contact.id,
              label: contact.name,
              media: <ContactAvatar contactId={contact.id} initials={contact.initials} />,
            }))}
            value={contactId}
            onValueChange={(id) => {
              setContactId(id)
              clear("contactId")
            }}
            // With no one yet, the last cell adds someone straight away.
            onShowAll={() => (contacts.length === 0 && onAddContact ? setAddingContact(true) : setScreen("contact"))}
            tileSize="sm"
            tileShape="circle"
            allIcon={contacts.length === 0 ? UserPlusIcon : UsersIcon}
            allLabel={contacts.length === 0 ? "Thêm người" : "Tất cả"}
            error={errors.contactId}
          />

          <div className="flex flex-col gap-2">
            <SettingsGroup>
              {/* First: owed from before, it needs no account, which folds away under it. */}
              <SettingsRow
                title="Nợ có sẵn"
                description={debt ? "Không đổi được sau khi đã ghi" : "Vay từ trước, không đổi số dư"}
                action={
                  <Switch
                    aria-label="Nợ có sẵn"
                    checked={isOpening}
                    // How it was recorded moved (or did not move) an account's balance; it stays.
                    disabled={pending || Boolean(debt)}
                    onCheckedChange={(checked) => {
                      setIsOpening(checked)
                      clear("accountId")
                    }}
                  />
                }
              />
              <SettingsRow
                collapsed={isOpening}
                id="debt-account"
                title={lent ? "Tiền ra từ" : "Tiền vào"}
                value={
                  <span className={cn("flex min-w-0 items-center gap-2", errors.accountId && "text-destructive")}>
                    {account ? <AccountLogo account={account} size="xs" /> : null}
                    <span className="min-w-0 truncate">
                      {account?.name ?? (activeAccounts.length === 0 ? "Chưa có tài khoản" : "Chọn tài khoản")}
                    </span>
                  </span>
                }
                disabled={activeAccounts.length === 0}
                onClick={() => setScreen("account")}
              />
              <TimeRows
                idPrefix="debt-recorded-at"
                title={isOpening ? "Bắt đầu theo dõi" : lent ? "Ngày cho vay" : "Ngày vay"}
                date={recordedAt}
                today={today}
                onDateChange={(date) => {
                  setRecordedAt(date)
                  clear("recordedAt")
                  clear("dueAt")
                }}
                invalid={Boolean(errors.recordedAt)}
              />
              <DueRows
                value={dueAt}
                from={recordedAt}
                onChange={(value) => {
                  setDueAt(value)
                  clear("dueAt")
                }}
                invalid={Boolean(errors.dueAt)}
              />
              {/* The note typed in place, as tall as a row (64) and growing with what is written. */}
              <li className={cn("flex min-h-16 items-center px-4 py-3", settingsSeparatorClassName())}>
                <label htmlFor="debt-note" className="sr-only">
                  Ghi chú
                </label>
                <textarea
                  ref={noteRef}
                  id="debt-note"
                  name="note"
                  rows={1}
                  defaultValue={debt?.note}
                  placeholder="Ghi chú (tuỳ chọn)"
                  maxLength={500}
                  onInput={(event) => fitNote(event.currentTarget)}
                  className="block min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </li>
            </SettingsGroup>
            {errors.accountId || errors.recordedAt || errors.dueAt ? (
              <FieldError className="px-4">{errors.accountId ?? errors.recordedAt ?? errors.dueAt}</FieldError>
            ) : !isOpening && activeAccounts.length === 0 ? (
              <FieldError className="px-4">Thêm tài khoản trước, hoặc bật nợ có sẵn.</FieldError>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <SettingsGroup>
              <SettingsRow
                title="Tính lãi"
                description={isOpening && hasInterest ? "Tính từ ngày bắt đầu theo dõi" : undefined}
                action={<Switch aria-label="Tính lãi" checked={hasInterest} disabled={pending} onCheckedChange={setHasInterest} />}
              />
              {hasInterest ? (
                <li className={cn("flex min-h-16 items-center gap-3 px-4 py-3", settingsSeparatorClassName())}>
                  <label htmlFor="debt-interest-rate" className={cn("shrink-0 text-sm font-medium", errors.interestRate && "text-destructive")}>
                    Lãi suất
                  </label>
                  <span className="flex min-w-0 flex-1 items-center justify-end gap-1 text-sm">
                    <input
                      id="debt-interest-rate"
                      value={interestRate}
                      onChange={(event) => {
                        setInterestRate(event.target.value)
                        clear("interestRate")
                      }}
                      inputMode="decimal"
                      placeholder="0"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.interestRate) || undefined}
                      className="w-14 min-w-0 bg-transparent text-right tabular-nums outline-none placeholder:text-muted-foreground"
                    />
                    <span className="text-muted-foreground">%</span>
                  </span>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={interestPeriod}
                    onValueChange={(value) => {
                      if (value) setInterestPeriod(value as InterestPeriod)
                    }}
                    aria-label="Chu kỳ tính lãi"
                  >
                    <ToggleGroupItem value="month">/tháng</ToggleGroupItem>
                    <ToggleGroupItem value="year">/năm</ToggleGroupItem>
                  </ToggleGroup>
                </li>
              ) : null}
              {hasInterest ? (
                <InterestPreview amount={amount} rate={rate} period={interestPeriod} recordedAt={recordedAt} dueAt={dueAt} />
              ) : null}
            </SettingsGroup>
            {errors.interestRate ? <FieldError className="px-4">{errors.interestRate}</FieldError> : null}
          </div>
        </fieldset>

        {screen ? null : (
          <PageSheetFooter>
            {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            {/* Deleting sits beside saving, as tall as it (with an undo, so the two side by side are safe). */}
            <div className="flex items-center gap-2">
              {debt && onDelete ? (
                <Button type="button" variant="destructive" size="icon" aria-label="Xoá khoản nợ" disabled={pending} onClick={onDelete}>
                  <Trash2Icon />
                </Button>
              ) : null}
              <Button type="submit" className="flex-1" disabled={pending || (!isOpening && activeAccounts.length === 0)}>
                <SaveIcon />
                {pending ? "Đang lưu…" : debt ? "Lưu thay đổi" : "Lưu khoản nợ"}
              </Button>
            </div>
          </PageSheetFooter>
        )}

      </form>
      {/* Stacked over this sheet, outside the form (a portal still passes React's submit up). The new person is picked once saved. */}
      {onAddContact ? (
        <AddContactSheet
          open={addingContact}
          onOpenChange={setAddingContact}
          onAddContact={async (values) => {
            const contact = await onAddContact(values)
            setContactId(contact.id)
            clear("contactId")
            back()
          }}
        />
      ) : null}
    </>
  )
}
