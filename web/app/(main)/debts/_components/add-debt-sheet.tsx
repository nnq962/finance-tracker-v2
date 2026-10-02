"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react"

import { AccountSelectGroups } from "@/components/account-select-groups"
import { AmountSuggestions, useAmountQuickPick } from "@/components/forms/amount-suggestions"
import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import { todayDate } from "../_lib/debt-payments"

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

const NO_HISTORY: number[] = []

const directionOptions = [
  {
    value: "lent",
    label: "Tôi cho vay",
    icon: ArrowUpRightIcon,
  },
  {
    value: "borrowed",
    label: "Tôi đi vay",
    icon: ArrowDownLeftIcon,
  },
] satisfies Array<{
  value: DebtDirection
  label: string
  icon: typeof ArrowUpRightIcon
}>

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
  const amountPick = useAmountQuickPick(debt?.amount ?? null, NO_HISTORY)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [wasOpen, setWasOpen] = React.useState(open)
  const [contactId, setContactId] = React.useState(debt?.contactId ?? "")
  const [addingContact, setAddingContact] = React.useState(false)

  // A controlled open never passes through onOpenChange, so reset the form
  // fields here whenever the sheet opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setErrorMessage(null)
      setDirection(debt?.direction ?? "lent")
      setRecordingMode(debt?.recordingMode ?? "cash-flow")
      setHasInterest(debt?.hasInterest ?? false)
      setContactId(debt?.contactId ?? "")
      amountPick.reset(debt?.amount ?? null)
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
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (submitting.current) return
      if (nextOpen) setErrorMessage(null)
      setOpen(nextOpen)
    }}>
      {controlledOpen === undefined ? <SheetTrigger asChild>
        {trigger ?? <Button
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
        </Button>}
      </SheetTrigger> : null}
      <SheetContent
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          if (returnFocusRef?.current) {
            event.preventDefault()
            returnFocusRef.current.focus()
          }
        }}
      >
        <SheetNavHeader
          title={debt ? "Sửa khoản nợ" : "Thêm khoản nợ"}
          disabled={pending}
        />

        <form
          className="flex min-h-0 flex-1 flex-col"
          aria-busy={pending}
          onSubmit={async (event) => {
            event.preventDefault()
            if (submitting.current) return
            const form = event.currentTarget
            const formData = new FormData(form)
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
              setErrorMessage(error instanceof Error ? error.message : "Không thể lưu khoản nợ.")
            } finally {
              submitting.current = false
              setPending(false)
            }
          }}
        >
          <fieldset disabled={pending} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <FieldGroup>
              <Card>
                <CardHeader>
                  <CardTitle>Khoản nợ</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel className="sr-only">Loại khoản nợ</FieldLabel>
                      <ToggleGroup
                        disabled={pending || Boolean(debt?.payments?.length)}
                        type="single"
                        variant="outline"
                        value={direction}
                        onValueChange={(value) => {
                          if (value) setDirection(value as DebtDirection)
                        }}
                        className="grid w-full grid-cols-2"
                        aria-label="Chọn loại khoản nợ"
                      >
                        {directionOptions.map(({ value, label, icon: Icon }) => (
                          <ToggleGroupItem key={value} value={value} className="w-full">
                            <Icon />
                            {label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      {debt?.payments?.length ? (
                        <FieldDescription>Đã có thanh toán nên không thể đổi chiều vay.</FieldDescription>
                      ) : null}
                    </Field>

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

                    <Field>
                      <div className="flex items-center justify-between gap-2">
                        <FieldLabel htmlFor="debt-contact">Người liên quan</FieldLabel>
                        {onAddContact ? (
                          <Button type="button" variant="ghost" size="xs" onClick={() => setAddingContact(true)}>
                            <PlusIcon />
                            Người mới
                          </Button>
                        ) : null}
                      </div>
                      <Select value={contactId} onValueChange={setContactId} name="contactId" required disabled={pending}>
                        <SelectTrigger id="debt-contact" className="w-full">
                          <SelectValue placeholder="Chọn từ danh bạ" />
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
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="debt-amount">{isOpening ? "Tiền gốc còn nợ" : "Số tiền"}</FieldLabel>
                      <CurrencyInput
                        id="debt-amount"
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

                    {!isOpening && <Field>
                      <FieldLabel htmlFor="debt-account">{accountLabel}</FieldLabel>
                      <Select defaultValue={debt?.accountId} name="accountId" required disabled={pending}>
                        <SelectTrigger id="debt-account" className="w-full">
                          <SelectValue placeholder="Chọn tài khoản" />
                        </SelectTrigger>
                        <SelectContent>
                          <AccountSelectGroups accounts={activeAccounts} />
                        </SelectContent>
                      </Select>
                    </Field>}

                    <Field>
                      <FieldLabel htmlFor="debt-note">Nội dung</FieldLabel>
                      <Textarea
                        id="debt-note"
                        name="note"
                        defaultValue={debt?.note}
                        required
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Điều khoản</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <div className="grid min-w-0 w-full gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <Field className="min-w-0">
                        <FieldLabel htmlFor="debt-recorded-at">
                          {isOpening ? "Ngày bắt đầu theo dõi" : "Ngày ghi"}
                        </FieldLabel>
                        <div className="flex min-w-0">
                          <Input
                            id="debt-recorded-at"
                            name="recordedAt"
                            type="date"
                            defaultValue={debt?.recordedAt ?? today}
                            required
                            className="w-auto min-w-0 max-w-full flex-1"
                          />
                        </div>
                      </Field>
                      <Field className="min-w-0">
                        <FieldLabel htmlFor="debt-due-at">
                          Hẹn trả
                        </FieldLabel>
                        <div className="flex min-w-0">
                          <Input
                            id="debt-due-at"
                            name="dueAt"
                            type="date"
                            defaultValue={debt?.dueAt}
                            className="w-auto min-w-0 max-w-full flex-1"
                          />
                        </div>
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
                        <Field>
                          <FieldLabel htmlFor="debt-interest-rate">
                            Lãi suất
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
                            />
                            <InputGroupAddon align="inline-end">
                              <InputGroupText>%</InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="debt-interest-period">
                            Chu kỳ
                          </FieldLabel>
                          <Select
                            disabled={pending}
                            name="interestPeriod"
                            defaultValue={debt?.interestPeriod ?? "month"}
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
                  </FieldGroup>
                </CardContent>
              </Card>
            </FieldGroup>
          </fieldset>

          <SheetFooter>
            {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}
            <div className="grid grid-cols-2 gap-2">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="w-full" disabled={pending}>
                  <XIcon />
                  Huỷ
                </Button>
              </SheetClose>
              <Button type="submit" className="w-full" disabled={pending || (!isOpening && activeAccounts.length === 0)}>
                <SaveIcon />
                {pending ? "Đang lưu…" : "Lưu khoản nợ"}
              </Button>
            </div>
          </SheetFooter>
        </form>
        {onAddContact ? (
          <AddContactSheet
            open={addingContact}
            onOpenChange={setAddingContact}
            onAddContact={async (values) => setContactId((await onAddContact(values)).id)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
