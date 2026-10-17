"use client"

import * as React from "react"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { BudgetHint } from "@/components/budgets/budget-hint"
import { CurrencyInput } from "@/components/forms/currency-input"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow, settingsSeparatorClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { getCurrentLocalDateTime, getLocalDateTime } from "@/lib/date-time"
import { formatDate, formatTime, toDateKey } from "@/lib/format-date"
import { randomId } from "@/lib/random-id"
import { scrollIntoViewWithin } from "@/lib/scroll-into-view"
import type {
  SupportedTransactionKind,
  Transaction,
  TransactionActionResult,
} from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { ExcludedRow } from "../excluded-row"
import { AccountPicker, canTransfer, TransferAccounts } from "./fields/account-fields"
import { CategoryGrid, CategoryPicker, gridCategories, NEW_CATEGORY_ID, type RetiredCategory } from "./fields/category-fields"
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
  /**
   * A category to be made as it is saved (the assistant's suggestion), for
   * the draft's kind: first in the grid, marked "Mới", chosen to start with;
   * submitted as NEW_CATEGORY_ID.
   */
  suggestedCategory?: { name: string; tile: React.ReactNode }
  isCreating?: boolean
  kind: SupportedTransactionKind
  onManageCategories?: () => void
  onSuccess: () => void
  submitLabel?: string
  successMessage: string
  /** Editing: deleting, a red bin beside Save. */
  onDelete?: () => void
}

/**
 * One form for every kind, laid out as a money app's: the amount large at
 * the top with its suggestions (the keyboard waits for a tap on it); for spending
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
  suggestedCategory,
  isCreating,
  kind,
  onManageCategories,
  onSuccess,
  submitLabel = "Lưu giao dịch",
  successMessage,
  onDelete,
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
  // Only the transaction edited keeps an archived account or a retired
  // category: written again, it is a new one, which the server refuses them.
  const editedIds = defaultValues
    ? ([defaultValues.accountId, defaultValues.fromAccountId, defaultValues.toAccountId].filter(Boolean) as string[])
    : []
  const keptIds = editedIds
  const usable = (account: Account, keep: string[]) => account.status === "active" || keep.includes(account.id)

  // Left out of the figures: as the transaction edited, or the one written again, had it.
  const [excluded, setExcluded] = React.useState(Boolean(defaultValues?.excluded ?? draft?.copyOf?.excluded))
  const [amount, setAmount] = React.useState<number | null>(
    defaultValues ? Math.abs(defaultValues.amount) : (draft?.amount ?? null),
  )
  // Each spending and income keeps its own account and category; a new one
  // starts on the account last used for that kind.
  const [picks, setPicks] = React.useState(() => {
    const isActive = (id?: string) => accounts.some((account) => account.status === "active" && account.id === id)
    // The edited transaction's own, whatever their state; else an active one.
    const startAccount = (id?: string) => (id && (editedIds.includes(id) || isActive(id)) ? id : undefined)
    const liveCategory = (id?: string) =>
      id && (defaultValues?.categoryId === id || categoryGroups.some((group) => group.items.some((item) => item.id === id)))
        ? id
        : undefined
    const cashFlow = (formKind: CashFlowKind) => {
      const start = base(formKind)
      const lastUsed = histories[formKind].find((transaction) => isActive(transaction.accountId))?.accountId
      return {
        accountId: startAccount(start?.accountId) ?? lastUsed ?? "",
        categoryId:
          liveCategory(start?.categoryId) ??
          (suggestedCategory && draft?.kind === formKind ? NEW_CATEGORY_ID : ""),
      }
    }
    const transfer = base("transfer")
    const lastFrom = histories.transfer.find((transaction) => isActive(transaction.fromAccountId))?.fromAccountId
    const from = startAccount(transfer?.fromAccountId) ?? lastFrom ?? ""
    const to = startAccount(transfer?.toAccountId)
    return {
      expense: cashFlow("expense"),
      income: cashFlow("income"),
      fromAccountId: from,
      toAccountId: to && to !== from ? to : "",
      // Kept here, so it survives switching kinds like the rest.
      fee: base("transfer")?.fee || null,
    }
  })
  const [feeOpen, setFeeOpen] = React.useState(Boolean(base("transfer")?.fee))
  // The note as tall as what it holds, also a note of several lines being edited.
  const noteRef = React.useRef<HTMLTextAreaElement>(null)
  const fitNote = (area: HTMLTextAreaElement) => {
    area.style.height = "auto"
    area.style.height = `${area.scrollHeight}px`
  }
  React.useLayoutEffect(() => {
    if (noteRef.current) fitNote(noteRef.current)
  }, [])
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
  // Only an edited transaction keeps a category no longer in the catalogue.
  const startCategory = cashFlowKind && defaultValues?.kind === cashFlowKind ? defaultValues : undefined
  const retired: RetiredCategory | undefined =
    startCategory?.categoryId && !items.some((item) => item.id === startCategory.categoryId)
      ? {
          id: startCategory.categoryId,
          name: startCategory.categoryName ?? "Hạng mục cũ",
          groupName: startCategory.categoryGroupName,
        }
      : undefined

  // The suggestion is offered on its own kind only.
  const offered = suggestedCategory && draft?.kind === cashFlowKind ? suggestedCategory : undefined

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
  // Editing spending the month's figures already count: the limits hint takes it out before adding the new amount.
  const savedAccount = accounts.find((account) => account.id === defaultValues?.accountId)
  const countedBefore =
    defaultValues?.kind === "expense" &&
    !defaultValues.excluded &&
    !defaultValues.accountExcluded &&
    savedAccount?.type !== "savings" &&
    defaultValues.categoryGroupId
      ? {
          groupId: defaultValues.categoryGroupId,
          amount: Math.abs(defaultValues.amount),
          month: getLocalDateTime(defaultValues.occurredAt).date.slice(0, 7),
        }
      : undefined
  // Dated before an account was opened: allowed, as older accounts may hold
  // such transactions, but said, as "Số dư ban đầu từ ngày …" no longer holds.
  // Compared to the minute, as the time is picked: one written down in the
  // minute the account was opened is not before it.
  const occurredAt = new Date(`${when.date}T${when.time}:00+07:00`).getTime()
  const openedMinute = (account: Account) => Math.floor(Date.parse(account.openedAt) / 60_000) * 60_000
  const openedLater = (kind === "transfer" ? [picks.fromAccountId, picks.toAccountId] : [cashFlowPick?.accountId])
    .map((id) => accounts.find((account) => account.id === id))
    .find((account) => account && openedMinute(account) > occurredAt)
  // Opened later the same day: the time says when, as the date alone would read as the same day.
  const openedLabel = openedLater
    ? toDateKey(openedLater.openedAt) === when.date
      ? `${formatTime(openedLater.openedAt)} ${formatDate(when.date)}`
      : formatDate(toDateKey(openedLater.openedAt))
    : ""

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
            {groups.length === 0 && !retired && !offered ? (
              <p className="px-4 text-sm text-muted-foreground">Chưa có hạng mục</p>
            ) : (
              <div className="flex flex-col gap-2">
                <CategoryGrid
                  id="transaction-category"
                  items={gridCategories(items, usage, cashFlowPick?.categoryId ?? "", (retired ? 1 : 0) + (offered ? 1 : 0))}
                  retired={retired}
                  suggested={offered}
                  value={cashFlowPick?.categoryId ?? ""}
                  onValueChange={(id) => {
                    setCashFlowPick({ categoryId: id })
                    clearError("categoryId")
                  }}
                  onShowAll={() => setScreen({ type: "category" })}
                  error={errors.categoryId}
                />
                {kind === "expense" ? (
                  <BudgetHint
                    groupId={groups.find((group) => group.items.some((item) => item.id === cashFlowPick?.categoryId))?.id}
                    date={when.date}
                    amount={amount}
                    // Limits leave out what is left out of the figures and what a savings jar pays.
                    counted={!excluded && !chosenAccount?.excluded && chosenAccount?.type !== "savings"}
                    editing={countedBefore}
                  />
                ) : null}
              </div>
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
                    value={picks.fee}
                    onValueChange={(fee) => setPicks((current) => ({ ...current, fee }))}
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
              idPrefix="transaction"
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
            {/* The note typed in place, as tall as a row of the list (64) and
                growing with what is written. */}
            <li className={cn("flex min-h-16 items-center px-4 py-3", settingsSeparatorClassName())}>
              <label htmlFor="transaction-note" className="sr-only">
                Ghi chú
              </label>
              <textarea
                ref={noteRef}
                id="transaction-note"
                name="note"
                rows={1}
                defaultValue={defaultValues?.note ?? draft?.note}
                placeholder="Ghi chú (tuỳ chọn)"
                onInput={(event) => fitNote(event.currentTarget)}
                className="block min-h-6 w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </li>
          </SettingsGroup>
          {errors.accountId || errors.date ? (
            <FieldError className="px-4">{errors.accountId ?? errors.date}</FieldError>
          ) : openedLater ? (
            <p className="px-4 text-xs text-muted-foreground">
              Trước lúc mở “{openedLater.name}” ({openedLabel}), số dư ban đầu sẽ không còn khớp.
            </p>
          ) : null}
        </div>

        {/* Last, as it is seldom wanted: income and spending only. */}
        {cashFlowKind ? (
          <SettingsGroup>
            <ExcludedRow
              name="excluded"
              kind={cashFlowKind}
              accountName={chosenAccount?.name}
              checked={excluded}
              onCheckedChange={setExcluded}
              byAccount={chosenAccount?.excluded}
            />
          </SettingsGroup>
        ) : null}
      </div>

      {screen ? null : (
        <PageSheetFooter>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          {/* Back is in the header; deleting beside saving, as tall as it, as in the account's editor. */}
          <div className="flex items-center gap-2">
            {onDelete ? (
              <Button type="button" variant="destructive" className="w-30 px-0" aria-label="Xoá giao dịch" disabled={isPending} onClick={onDelete}>
                <Trash2Icon />
                Xoá
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" disabled={isPending || blocked}>
              {isPending ? <Spinner /> : <SaveIcon />}
              {isPending ? "Đang lưu…" : submitLabel}
            </Button>
          </div>
        </PageSheetFooter>
      )}
    </form>
  )
}
