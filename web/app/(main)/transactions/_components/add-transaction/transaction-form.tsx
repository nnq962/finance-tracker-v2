"use client"

import * as React from "react"
import { PlusIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { getCurrentLocalDateTime, getLocalDateTime } from "@/lib/date-time"
import { toDateKey } from "@/lib/format-date"
import { randomId } from "@/lib/random-id"
import { scrollIntoViewWithin } from "@/lib/scroll-into-view"
import type {
  SupportedTransactionKind,
  Transaction,
  TransactionActionResult,
} from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { AccountPicker, canTransfer, TransferAccounts } from "./fields/account-fields"
import { CategoryGrid, CategoryPicker, gridCategories, type RetiredCategory } from "./fields/category-fields"
import { TimeRows } from "./fields/time-row"
import type { TransactionDraft, TransactionFieldErrors, TransactionFieldName } from "./form-types"
import { NeedAccountState } from "./need-account-state"
import { useTransactionHistory } from "./transaction-history-context"
import { validateTransactionForm } from "./validate-transaction-form"

/** Where each field's error sends the focus, in the order they appear. */
const fieldOrder: TransactionFieldName[] = ["amount", "categoryId", "fromAccountId", "toAccountId", "accountId", "date"]

const fieldElementId: Record<TransactionFieldName, string> = {
  amount: "transaction-amount",
  categoryId: "transaction-category",
  fromAccountId: "transfer-from-account",
  toAccountId: "transfer-to-account",
  accountId: "transaction-account",
  date: "transaction-date-row",
}

type CashFlowKind = "expense" | "income"

/** A deeper screen of the sheet: the whole category list, or an account list for a field. */
type Screen = { type: "category" } | { type: "account"; field: "accountId" | "fromAccountId" | "toAccountId" }

type TransactionFormProps = {
  accounts: Account[]
  action: (formData: FormData) => Promise<TransactionActionResult>
  categoryGroups: CategoryGroup[]
  defaultValues?: Transaction
  /** A new transaction filled in ahead: amount, time and note, and from `copyOf` its accounts, category and fee. */
  draft?: TransactionDraft
  /** Above the amount, hidden with the first screen: the kind's segmented control. */
  header?: React.ReactNode
  isCreating?: boolean
  kind: SupportedTransactionKind
  onManageCategories?: () => void
  onSuccess: () => void
  submitLabel?: string
  successMessage: string
}

/**
 * One form for every kind, laid out as a money app's: the amount large at
 * the top (the keyboard up on a new entry) with its suggestions; for spending
 * and income the category as a grid of icons, then rows for the account,
 * the time (with today, yesterday, the day before) and an inline note; for a
 * transfer its two accounts side by side, swappable, and a fee only when
 * added. The category list and the account lists open as deeper screens of
 * the sheet (‹ back). The amount, time and note are shared, so they survive
 * switching kinds, and each kind keeps its own picks. Missing fields are
 * pointed out where they are before sending.
 */
export function TransactionForm({
  accounts,
  action,
  categoryGroups,
  defaultValues,
  draft,
  header,
  isCreating,
  kind,
  onManageCategories,
  onSuccess,
  submitLabel = "Lưu giao dịch",
  successMessage,
}: TransactionFormProps) {
  const [isPending, startTransition] = React.useTransition()
  // Kept across retries of one entry so the server records it only once.
  const [requestId, setRequestId] = React.useState(() => draft?.requestId ?? randomId())
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  // Errors belong to the kind they were found on; another kind starts clean.
  const [checked, setChecked] = React.useState<{ kind: SupportedTransactionKind; errors: TransactionFieldErrors }>({
    kind,
    errors: {},
  })
  const errors = checked.kind === kind ? checked.errors : {}
  const clearError = (name: TransactionFieldName) =>
    setChecked((current) => {
      if (!current.errors[name]) return current
      const next = { ...current.errors }
      delete next[name]
      return { ...current, errors: next }
    })

  // What each kind starts from: the transaction edited, or the one written again.
  const base = (formKind: SupportedTransactionKind) =>
    defaultValues?.kind === formKind ? defaultValues : draft?.copyOf?.kind === formKind ? draft.copyOf : undefined
  const histories = {
    expense: useTransactionHistory("expense", defaultValues?.id),
    income: useTransactionHistory("income", defaultValues?.id),
    transfer: useTransactionHistory("transfer", defaultValues?.id),
  }
  const historyAmounts = histories[kind].map((transaction) => Math.abs(transaction.amount))
  const keptIds = [base(kind)?.accountId, base(kind)?.fromAccountId, base(kind)?.toAccountId].filter(Boolean) as string[]
  const usable = (account: Account, keep: string[]) => account.status === "active" || keep.includes(account.id)

  const [amount, setAmount] = React.useState<number | null>(
    defaultValues ? Math.abs(defaultValues.amount) : (draft?.amount ?? null),
  )
  // Each spending and income keeps its own account and category; a new one
  // starts on the account last used for that kind.
  const [picks, setPicks] = React.useState(() => {
    const cashFlow = (formKind: CashFlowKind) => {
      const start = base(formKind)
      const lastUsed = start
        ? undefined
        : histories[formKind].find((transaction) =>
            accounts.some((account) => account.status === "active" && account.id === transaction.accountId),
          )?.accountId
      return { accountId: start?.accountId ?? lastUsed ?? "", categoryId: start?.categoryId ?? "" }
    }
    const transfer = base("transfer")
    const lastFrom = transfer
      ? undefined
      : histories.transfer.find((transaction) =>
          accounts.some((account) => account.status === "active" && account.id === transaction.fromAccountId),
        )?.fromAccountId
    return {
      expense: cashFlow("expense"),
      income: cashFlow("income"),
      fromAccountId: transfer?.fromAccountId ?? lastFrom ?? "",
      toAccountId: transfer?.toAccountId && transfer.toAccountId !== transfer.fromAccountId ? transfer.toAccountId : "",
    }
  })
  const [feeOpen, setFeeOpen] = React.useState(Boolean(base("transfer")?.fee))
  const feeRef = React.useRef<HTMLLIElement>(null)

  const startTime = defaultValues?.occurredAt ?? draft?.occurredAt
  const [when, setWhen] = React.useState(() =>
    startTime ? getLocalDateTime(startTime) : getCurrentLocalDateTime(),
  )
  const today = toDateKey(new Date())

  const [screen, setScreen] = React.useState<Screen | null>(null)
  const back = () => setScreen(null)
  usePageSheetScreen(
    screen === null
      ? null
      : {
          title: screen.type === "category" ? "Hạng mục" : screen.field === "toAccountId" ? "Đến tài khoản" : screen.field === "fromAccountId" ? "Từ tài khoản" : "Tài khoản",
          onBack: back,
        },
  )

  const cashFlowKind = kind === "transfer" ? undefined : kind
  const cashFlowPick = cashFlowKind ? picks[cashFlowKind] : undefined
  const setCashFlowPick = (patch: Partial<{ accountId: string; categoryId: string }>) => {
    if (!cashFlowKind) return
    setPicks((current) => ({ ...current, [cashFlowKind]: { ...current[cashFlowKind], ...patch } }))
  }

  // The kind's categories, the most used first in the grid.
  const groups = cashFlowKind ? categoryGroups.filter((group) => group.type === cashFlowKind && group.items.length > 0) : []
  const items = groups.flatMap((group) => group.items)
  const usage = new Map<string, number>()
  if (cashFlowKind) {
    for (const transaction of histories[cashFlowKind]) {
      if (transaction.categoryId) usage.set(transaction.categoryId, (usage.get(transaction.categoryId) ?? 0) + 1)
    }
  }
  const startCategory = cashFlowKind ? base(cashFlowKind) : undefined
  const retired: RetiredCategory | undefined =
    startCategory?.categoryId && !items.some((item) => item.id === startCategory.categoryId)
      ? {
          id: startCategory.categoryId,
          name: startCategory.categoryName ?? "Hạng mục cũ",
          groupName: startCategory.categoryGroupName,
        }
      : undefined

  // Without two accounts the transfer tab shows how to add one instead, and cannot be saved.
  const blocked = kind === "transfer" && !canTransfer(accounts, keptIds)
  const pickableAccounts = (field: "accountId" | "fromAccountId" | "toAccountId") => {
    const other = field === "fromAccountId" ? picks.toAccountId : field === "toAccountId" ? picks.fromAccountId : ""
    return accounts.filter((account) => usable(account, keptIds) && account.id !== other)
  }
  const accountValue = (field: "accountId" | "fromAccountId" | "toAccountId") =>
    field === "accountId" ? (cashFlowPick?.accountId ?? "") : picks[field]
  const pickAccount = (field: "accountId" | "fromAccountId" | "toAccountId", id: string) => {
    if (field === "accountId") setCashFlowPick({ accountId: id })
    else setPicks((current) => ({ ...current, [field]: id }))
    clearError(field)
    back()
  }
  const chosenAccount = accounts.find((account) => account.id === cashFlowPick?.accountId)

  return (
    <form
      noValidate
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        const found = validateTransactionForm(formData, kind)
        setChecked({ kind, errors: found })
        const first = fieldOrder.find((name) => found[name])
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
            setErrorMessage("Không thể lưu giao dịch. Vui lòng thử lại.")
          }
        })
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      {isCreating ? <input type="hidden" name="requestId" value={requestId} /> : null}

      {/* The deeper screens; the first stays mounted under them, so nothing typed is lost. */}
      {screen?.type === "category" ? (
        <CategoryPicker
          groups={groups}
          retired={retired}
          value={cashFlowPick?.categoryId ?? ""}
          onPick={(id) => {
            setCashFlowPick({ categoryId: id })
            clearError("categoryId")
            back()
          }}
          onManage={onManageCategories}
        />
      ) : null}
      {screen?.type === "account" ? (
        <AccountPicker
          accounts={pickableAccounts(screen.field)}
          value={accountValue(screen.field)}
          onPick={(id) => pickAccount(screen.field, id)}
        />
      ) : null}

      <div className={cn("flex flex-col gap-6 pb-4", screen && "hidden")}>
        {header}
        <div className="flex flex-col items-center gap-2">
          <FieldLabel htmlFor="transaction-amount" className="sr-only">
            Số tiền
          </FieldLabel>
          <CurrencyInput
            variant="hero"
            id="transaction-amount"
            name="amount"
            value={amount}
            history={historyAmounts}
            sign={kind === "expense" ? "−" : kind === "income" ? "+" : undefined}
            tone={kind === "income" ? "income" : "default"}
            autoFocus={isCreating && !draft}
            onValueChange={(value) => {
              setAmount(value)
              clearError("amount")
            }}
            invalid={Boolean(errors.amount)}
            required
          />
          {errors.amount ? <FieldError className="text-center">{errors.amount}</FieldError> : null}
        </div>

        {cashFlowKind ? (
          <>
            {groups.length === 0 && !retired ? (
              <p className="px-4 text-sm text-muted-foreground">Chưa có hạng mục</p>
            ) : (
              <CategoryGrid
                id="transaction-category"
                items={gridCategories(items, usage, cashFlowPick?.categoryId ?? "")}
                retired={retired}
                value={cashFlowPick?.categoryId ?? ""}
                onValueChange={(id) => {
                  setCashFlowPick({ categoryId: id })
                  clearError("categoryId")
                }}
                onShowAll={() => setScreen({ type: "category" })}
                error={errors.categoryId}
              />
            )}
            <input type="hidden" name="categoryId" value={cashFlowPick?.categoryId ?? ""} />
            <input type="hidden" name="accountId" value={cashFlowPick?.accountId ?? ""} />
          </>
        ) : blocked ? (
          <NeedAccountState title="Cần ít nhất 2 tài khoản" description="Thêm một tài khoản nữa để chuyển tiền." />
        ) : (
          <>
            <TransferAccounts
              accounts={accounts}
              fromAccountId={picks.fromAccountId}
              toAccountId={picks.toAccountId}
              onPickFrom={() => setScreen({ type: "account", field: "fromAccountId" })}
              onPickTo={() => setScreen({ type: "account", field: "toAccountId" })}
              onSwap={() => {
                setPicks((current) => ({ ...current, fromAccountId: current.toAccountId, toAccountId: current.fromAccountId }))
                clearError("fromAccountId")
                clearError("toAccountId")
              }}
              fromError={errors.fromAccountId}
              toError={errors.toAccountId}
            />
            {/* The fee, seldom set, folded under a row until asked for. */}
            <SettingsGroup>
              {feeOpen ? (
                <li ref={feeRef} className="flex flex-col gap-2 px-4 py-3">
                  <FieldLabel htmlFor="transfer-fee">Phí chuyển khoản</FieldLabel>
                  <CurrencyInput
                    id="transfer-fee"
                    name="fee"
                    defaultValue={base("transfer")?.fee || undefined}
                    suggestions={false}
                  />
                </li>
              ) : (
                <SettingsRow
                  icon={PlusIcon}
                  title="Thêm phí chuyển khoản"
                  chevron={false}
                  onClick={() => {
                    setFeeOpen(true)
                    requestAnimationFrame(() => feeRef.current?.querySelector("input")?.focus())
                  }}
                />
              )}
            </SettingsGroup>
          </>
        )}

        <div className="flex flex-col gap-2">
          <SettingsGroup>
            {cashFlowKind ? (
              <SettingsRow
                id="transaction-account"
                title="Tài khoản"
                value={
                  <span className={cn("flex min-w-0 items-center gap-2", errors.accountId && "text-destructive")}>
                    {chosenAccount ? <AccountLogo account={chosenAccount} size="xs" /> : null}
                    <span className="min-w-0 truncate">{chosenAccount?.name ?? "Chọn tài khoản"}</span>
                  </span>
                }
                onClick={() => setScreen({ type: "account", field: "accountId" })}
              />
            ) : null}
            <TimeRows
              date={when.date}
              time={when.time}
              today={today}
              onDateChange={(date) => {
                setWhen((current) => ({ ...current, date }))
                clearError("date")
              }}
              onTimeChange={(time) => {
                setWhen((current) => ({ ...current, time }))
                clearError("date")
              }}
              invalid={Boolean(errors.date)}
            />
            {/* The note typed in place, growing with what is written. */}
            <li className={cn("px-4 py-3", settingsSeparatorClassName())}>
              <label htmlFor="transaction-note" className="sr-only">
                Ghi chú
              </label>
              <textarea
                id="transaction-note"
                name="note"
                rows={1}
                defaultValue={defaultValues?.note ?? draft?.note}
                placeholder="Ghi chú (tuỳ chọn)"
                onInput={(event) => {
                  const area = event.currentTarget
                  area.style.height = "auto"
                  area.style.height = `${area.scrollHeight}px`
                }}
                className="block min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </li>
          </SettingsGroup>
          {errors.accountId || errors.date ? (
            <FieldError className="px-4">{errors.accountId ?? errors.date}</FieldError>
          ) : null}
        </div>
      </div>

      {screen ? null : (
        <PageSheetFooter>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          {/* Back is in the header, so the footer only saves. */}
          <Button type="submit" className="w-full" disabled={isPending || blocked}>
            {isPending ? <Spinner /> : <SaveIcon />}
            {isPending ? "Đang lưu..." : submitLabel}
          </Button>
        </PageSheetFooter>
      )}
    </form>
  )
}
