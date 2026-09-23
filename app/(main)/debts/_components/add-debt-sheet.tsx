"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PlusIcon,
  SaveIcon,
} from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { Button as AnimatedButton } from "@/components/animate-ui/components/buttons/button"
import { CurrencyInput } from "@/components/forms/currency-input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { todayDate } from "../_lib/debt-payments"

import type {
  Contact,
  Debt,
  DebtDirection,
  InterestPeriod,
  NewDebt,
} from "../_types/debt"

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

const accountTypeOptions = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Ngân hàng" },
  { value: "e-wallet", label: "Ví điện tử" },
] satisfies Array<{ value: Account["type"]; label: string }>

type AddDebtSheetProps = {
  debt?: Debt
  trigger?: React.ReactNode
  accounts: Account[]
  contacts: Contact[]
  onAddDebt: (debt: NewDebt) => Promise<void>
}

export function AddDebtSheet({
  debt,
  trigger,
  accounts,
  contacts,
  onAddDebt,
}: AddDebtSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [direction, setDirection] = React.useState<DebtDirection>(debt?.direction ?? "lent")
  const [hasInterest, setHasInterest] = React.useState(debt?.hasInterest ?? false)
  const [pending, setPending] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const submitting = React.useRef(false)
  const today = React.useMemo(() => todayDate(), [])
  const accountLabel =
    direction === "lent" ? "Nguồn tiền" : "Tài khoản nhận tiền"
  const accountDescription =
    direction === "lent"
      ? "Khoản cho vay sẽ được lấy ra từ tài khoản này."
      : "Khoản tiền đi vay sẽ được nhận vào tài khoản này."
  const activeAccounts = accounts.filter((account) => account.status === "active" || account.id === debt?.accountId)
  const accountGroups = accountTypeOptions.map((option) => ({
    ...option,
    accounts: activeAccounts.filter((account) => account.type === option.value),
  }))
  const isDisabled = contacts.length === 0 || activeAccounts.length === 0

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (submitting.current) return
      if (nextOpen) { setErrorMessage(null); setDirection(debt?.direction ?? "lent"); setHasInterest(debt?.hasInterest ?? false) }
      setOpen(nextOpen)
    }}>
      <SheetTrigger asChild>
        {trigger ?? <AnimatedButton
          type="button"
          disabled={isDisabled}
          title={
            contacts.length === 0
              ? "Thêm người liên quan trước khi tạo khoản nợ"
              : activeAccounts.length === 0
                ? "Thêm tài khoản trước khi tạo khoản nợ"
                : undefined
          }
        >
          <PlusIcon />
          Thêm khoản nợ
        </AnimatedButton>}
      </SheetTrigger>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-md!"
        showCloseButton={!pending}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{debt ? "Sửa khoản nợ" : "Thêm khoản nợ"}</SheetTitle>
          <SheetDescription>
            {debt ? "Thay đổi thông tin và điều khoản. Số dư được điều chỉnh theo khoản nợ mới; lịch sử thanh toán được giữ lại." : "Ghi lại khoản đang cho vay hoặc đi vay và các điều khoản liên quan."}
          </SheetDescription>
        </SheetHeader>

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
                accountId: String(formData.get("accountId")),
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
                  <CardTitle>Loại giao dịch</CardTitle>
                  <CardDescription>
                    {debt?.payments?.length ? "Khoản đã có thanh toán không thể đổi chiều vay." : "Chọn chiều tiền phù hợp với khoản nợ."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Field>
                    <FieldLabel className="sr-only">
                      Loại khoản nợ
                    </FieldLabel>
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
                      {directionOptions.map(
                        ({ value, label, icon: Icon }) => (
                          <ToggleGroupItem
                            key={value}
                            value={value}
                            className="w-full"
                          >
                            <Icon />
                            {label}
                          </ToggleGroupItem>
                        ),
                      )}
                    </ToggleGroup>
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thông tin khoản nợ</CardTitle>
                  <CardDescription>
                    Chọn người liên quan, tài khoản và nhập số tiền.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="debt-contact">
                        Người liên quan
                      </FieldLabel>
                      <Select defaultValue={debt?.contactId} name="contactId" required disabled={pending}>
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
                      <FieldLabel htmlFor="debt-amount">Số tiền</FieldLabel>
                      <CurrencyInput
                        id="debt-amount"
                        name="amount"
                        defaultValue={debt?.amount}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="debt-account">
                        {accountLabel}
                      </FieldLabel>
                      <Select defaultValue={debt?.accountId} name="accountId" required disabled={pending}>
                        <SelectTrigger id="debt-account" className="w-full">
                          <SelectValue placeholder="Chọn tài khoản" />
                        </SelectTrigger>
                        <SelectContent>
                          {accountGroups.map((group) =>
                            group.accounts.length > 0 ? (
                              <SelectGroup key={group.value}>
                                <SelectLabel>{group.label}</SelectLabel>
                                {group.accounts.map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                    textValue={account.name}
                                  >
                                    <AccountLogo
                                      account={account}
                                      className="size-5! p-0.5! [&>svg]:size-3!"
                                    />
                                    <span className="min-w-0 truncate">
                                      {account.name}
                                    </span>
                                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                                      {formatCurrency(account.balance)}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ) : null,
                          )}
                        </SelectContent>
                      </Select>
                      <FieldDescription>{accountDescription}</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="debt-note">Nội dung</FieldLabel>
                      <Textarea
                        id="debt-note"
                        name="note"
                        defaultValue={debt?.note}
                        required
                        placeholder="Ví dụ: Cho mượn đóng học phí"
                      />
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Điều khoản</CardTitle>
                  <CardDescription>
                    Thiết lập thời hạn và lãi suất nếu có.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="debt-recorded-at">
                          Ngày ghi
                        </FieldLabel>
                        <Input
                          id="debt-recorded-at"
                          name="recordedAt"
                          type="date"
                          defaultValue={debt?.recordedAt ?? today}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="debt-due-at">
                          Hẹn trả <Badge variant="outline">Tùy chọn</Badge>
                        </FieldLabel>
                        <Input
                          id="debt-due-at"
                          name="dueAt"
                          type="date"
                          defaultValue={debt?.dueAt}
                        />
                      </Field>
                    </div>

                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldLabel htmlFor="debt-has-interest">
                          Có tính lãi
                        </FieldLabel>
                        <FieldDescription>
                          Bật để lưu mức lãi suất của khoản nợ.
                        </FieldDescription>
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
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              <SaveIcon />
              {pending ? "Đang lưu…" : "Lưu khoản nợ"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
