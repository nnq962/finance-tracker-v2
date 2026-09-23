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
import { getCurrentLocalDateTime } from "@/lib/date-time"
import { formatCurrency } from "@/lib/format-currency"

import type {
  Contact,
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
  accounts: Account[]
  contacts: Contact[]
  onAddDebt: (debt: NewDebt) => void
}

export function AddDebtSheet({
  accounts,
  contacts,
  onAddDebt,
}: AddDebtSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [direction, setDirection] = React.useState<DebtDirection>("lent")
  const [hasInterest, setHasInterest] = React.useState(false)
  const today = React.useMemo(() => getCurrentLocalDateTime().date, [])
  const accountLabel =
    direction === "lent" ? "Nguồn tiền" : "Tài khoản nhận tiền"
  const accountDescription =
    direction === "lent"
      ? "Khoản cho vay sẽ được lấy ra từ tài khoản này."
      : "Khoản tiền đi vay sẽ được nhận vào tài khoản này."
  const accountGroups = accountTypeOptions.map((option) => ({
    ...option,
    accounts: accounts.filter((account) => account.type === option.value),
  }))
  const isDisabled = contacts.length === 0 || accounts.length === 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <AnimatedButton
          type="button"
          disabled={isDisabled}
          title={
            contacts.length === 0
              ? "Thêm người liên quan trước khi tạo khoản nợ"
              : accounts.length === 0
                ? "Thêm tài khoản trước khi tạo khoản nợ"
                : undefined
          }
        >
          <PlusIcon />
          Thêm khoản nợ
        </AnimatedButton>
      </SheetTrigger>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Thêm khoản nợ</SheetTitle>
          <SheetDescription>
            Ghi lại khoản đang cho vay hoặc đi vay và các điều khoản liên quan.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)

            onAddDebt({
              accountId: String(formData.get("accountId")),
              contactId: String(formData.get("contactId")),
              direction,
              amount: Number(formData.get("amount")),
              paidAmount: 0,
              hasInterest,
              interestRate: hasInterest
                ? Number(formData.get("interestRate"))
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
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
            <FieldGroup>
              <Card>
                <CardHeader>
                  <CardTitle>Loại giao dịch</CardTitle>
                  <CardDescription>
                    Chọn chiều tiền phù hợp với khoản nợ.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Field>
                    <FieldLabel className="sr-only">
                      Loại khoản nợ
                    </FieldLabel>
                    <ToggleGroup
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
                      <Select name="contactId" required>
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
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="debt-account">
                        {accountLabel}
                      </FieldLabel>
                      <Select name="accountId" required>
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
                          defaultValue={today}
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
                          min={today}
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
                              type="number"
                              inputMode="decimal"
                              min="0.01"
                              step="0.01"
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
                            name="interestPeriod"
                            defaultValue="month"
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
          </div>

          <SheetFooter>
            <Button type="submit" size="lg" className="w-full">
              <SaveIcon />
              Lưu khoản nợ
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
