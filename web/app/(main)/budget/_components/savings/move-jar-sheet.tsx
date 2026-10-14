"use client"

import * as React from "react"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { Account } from "@/lib/accounts/types"
import { getCurrentLocalDateTime } from "@/lib/date-time"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { toDateKey } from "@/lib/format-date"
import { randomId } from "@/lib/random-id"
import { amountLeft, monthlyAmount } from "@/lib/savings/plan"
import { cn } from "@/lib/utils"

import { AccountPicker } from "../../../transactions/_components/add-transaction/fields/account-fields"
import { moveJarAction } from "../../savings-actions"

/**
 * Money into a jar from an account ("in") or back out of it to one ("out"),
 * written down as a transfer: the amount large, with the amounts that mean
 * something for this jar (this month's share, what is left to the target;
 * taking out, all of it), the account (a deeper screen), when, and a note.
 */
export function MoveJarSheet({
  jar,
  way,
  accounts,
  open,
  onOpenChange,
}: {
  jar: Account
  way: "in" | "out"
  /** Every account; those in use, other than jars, can be picked. */
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <PageSheet title={way === "in" ? `Nạp vào hũ ${jar.name}` : `Rút từ hũ ${jar.name}`} open={open} onOpenChange={onOpenChange}>
      {open ? <MoveForm jar={jar} way={way} accounts={accounts} onDone={() => onOpenChange(false)} /> : null}
    </PageSheet>
  )
}

function MoveForm({ jar, way, accounts, onDone }: { jar: Account; way: "in" | "out"; accounts: Account[]; onDone: () => void }) {
  const today = toDateKey(new Date())
  const choices = accounts.filter((account) => account.status === "active" && account.type !== "savings")
  const [pending, startTransition] = React.useTransition()
  const [requestId] = React.useState(() => randomId())
  const [error, setError] = React.useState<string | null>(null)
  const [amountError, setAmountError] = React.useState<string | null>(null)
  const [amount, setAmount] = React.useState<number | null>(null)
  // The account with the most money to start with, the likely one to put aside from.
  const [accountId, setAccountId] = React.useState(() => [...choices].sort((left, right) => right.balance - left.balance)[0]?.id ?? "")
  const [when, setWhen] = React.useState(getCurrentLocalDateTime)
  const [picking, setPicking] = React.useState(false)
  usePageSheetScreen(picking ? { title: "Chọn tài khoản", onBack: () => setPicking(false) } : null)

  const left = amountLeft(jar)
  const monthly = monthlyAmount(jar, today)
  // Quick amounts that mean something for this jar, rather than round numbers.
  const quick =
    way === "in"
      ? [
          monthly ? { label: `Tháng này · ${formatCompactCurrency(monthly, 1)}`, value: monthly } : null,
          left ? { label: `Đủ mục tiêu · ${formatCompactCurrency(left, 1)}`, value: left } : null,
        ].filter((item): item is { label: string; value: number } => item !== null && item.value > 0)
      : jar.balance > 0
        ? [{ label: `Rút hết · ${formatCompactCurrency(jar.balance, 1)}`, value: jar.balance }]
        : []
  const account = choices.find((item) => item.id === accountId)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!amount) {
      setAmountError("Nhập số tiền.")
      document.getElementById("jar-move-amount")?.focus()
      return
    }
    if (!accountId) return setError("Chọn tài khoản.")
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        const result = await moveJarAction(jar.id, way, formData)
        if (!result.success) return setError(result.error)
        toast.success(way === "in" ? `Đã nạp vào hũ ${jar.name}.` : `Đã rút từ hũ ${jar.name}.`)
        onDone()
      } catch {
        setError("Không thể lưu. Vui lòng thử lại.")
      }
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="accountId" value={accountId} />

      {picking ? (
        <AccountPicker
          accounts={choices}
          value={accountId}
          onPick={(id) => {
            setAccountId(id)
            setError(null)
            setPicking(false)
          }}
        />
      ) : null}

      <div className={cn("flex flex-col gap-6 pb-4", picking && "hidden")}>
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="jar-move-amount" className="text-xs text-muted-foreground">
            Số tiền
          </label>
          <CurrencyInput
            variant="hero"
            id="jar-move-amount"
            name="amount"
            value={amount}
            onValueChange={(value) => {
              setAmount(value)
              setAmountError(null)
            }}
            invalid={Boolean(amountError)}
            suggestions={false}
            required
          />
          {amountError ? <FieldError className="text-center">{amountError}</FieldError> : null}
          {quick.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {quick.map((item) => (
                <Button
                  key={item.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAmount(item.value)
                    setAmountError(null)
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          ) : null}
          {way === "out" ? <p className="text-center text-xs text-muted-foreground">Trong hũ đang có {formatCurrency(jar.balance)}</p> : null}
        </div>

        <SettingsGroup>
          <SettingsRow
            media={account ? <AccountLogo account={account} /> : undefined}
            title={way === "in" ? "Từ tài khoản" : "Về tài khoản"}
            value={account?.name ?? "Chọn tài khoản"}
            onClick={() => setPicking(true)}
          />
          <TimeRows
            idPrefix="jar-move"
            date={when.date}
            time={when.time}
            today={today}
            onDateChange={(date) => setWhen((current) => ({ ...current, date }))}
            onTimeChange={(time) => setWhen((current) => ({ ...current, time }))}
            invalid={false}
          />
          <li className={cn("flex min-h-16 items-center px-4 py-3", settingsSeparatorClassName())}>
            <label htmlFor="jar-move-note" className="sr-only">
              Ghi chú
            </label>
            <input
              id="jar-move-note"
              name="note"
              placeholder="Ghi chú (tuỳ chọn)"
              maxLength={500}
              autoComplete="off"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </li>
        </SettingsGroup>
      </div>

      {picking ? null : (
        <PageSheetFooter>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Spinner /> : null}
            {pending ? "Đang lưu..." : way === "in" ? "Nạp vào hũ" : "Rút ra"}
          </Button>
        </PageSheetFooter>
      )}
    </form>
  )
}
