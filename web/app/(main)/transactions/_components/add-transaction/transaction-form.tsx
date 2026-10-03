"use client"

import * as React from "react"
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { AmountSuggestions, useAmountQuickPick } from "@/components/forms/amount-suggestions"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DateTimeFields } from "@/components/forms/date-time-fields"
import { RequiredMark } from "@/components/forms/required-mark"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { getLocalDateTime } from "@/lib/date-time"
import { toDateKey } from "@/lib/format-date"
import type {
  SupportedTransactionKind,
  Transaction,
  TransactionActionResult,
} from "@/lib/transactions/types"

import { CashFlowFields } from "./fields/cash-flow-fields"
import { canTransfer, TransferFields } from "./fields/transfer-fields"
import type { TransactionFieldErrors, TransactionFieldName } from "./form-types"
import { useTransactionHistory } from "./transaction-history-context"
import { validateTransactionForm } from "./validate-transaction-form"

const transactionKinds: SupportedTransactionKind[] = ["expense", "income", "transfer"]

/** Where each field's error sends the focus, in the order they appear. */
const fieldOrder: TransactionFieldName[] = ["amount", "accountId", "fromAccountId", "toAccountId", "categoryId", "date"]

function fieldElementId(name: TransactionFieldName, kind: SupportedTransactionKind) {
  switch (name) {
    case "amount":
      return "transaction-amount"
    case "accountId":
      return `${kind}-account`
    case "categoryId":
      return `${kind}-category`
    case "fromAccountId":
      return "transfer-from-account"
    case "toAccountId":
      return "transfer-to-account"
    case "date":
      return "transaction-date"
  }
}

type TransactionFormProps = {
  accounts: Account[]
  action: (formData: FormData) => Promise<TransactionActionResult>
  categoryGroups: CategoryGroup[]
  defaultValues?: Transaction
  isCreating?: boolean
  kind: SupportedTransactionKind
  onManageCategories?: () => void
  onSuccess: () => void
  submitLabel?: string
  successMessage: string
}

/**
 * One form for every kind. The amount, time and note are shared, so they
 * survive switching kinds; the fields that differ (accounts, category, fee)
 * stay mounted per kind, hidden and left out of the submission (a disabled
 * fieldset) when another kind is chosen, so a half-filled kind keeps its
 * choices. Missing fields are pointed out under each one before sending.
 */
export function TransactionForm({
  accounts,
  action,
  categoryGroups,
  defaultValues,
  isCreating,
  kind,
  onManageCategories,
  onSuccess,
  submitLabel = "Lưu giao dịch",
  successMessage,
}: TransactionFormProps) {
  const [isPending, startTransition] = React.useTransition()
  // Kept across retries of one entry so the server records it only once.
  const [requestId, setRequestId] = React.useState(() => crypto.randomUUID())
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

  const history = useTransactionHistory(kind, defaultValues?.id)
  const historyAmounts = React.useMemo(
    () => history.map((transaction) => Math.abs(transaction.amount)),
    [history],
  )
  const amountPick = useAmountQuickPick(
    defaultValues ? Math.abs(defaultValues.amount) : null,
    historyAmounts,
  )
  const defaultDateTime = defaultValues
    ? getLocalDateTime(defaultValues.occurredAt)
    : undefined
  // Without two accounts the transfer tab shows how to add one instead, and cannot be saved.
  const blocked =
    kind === "transfer" &&
    !canTransfer(accounts, defaultValues?.kind === "transfer" ? defaultValues : undefined)

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        const found = validateTransactionForm(formData, kind)
        setChecked({ kind, errors: found })
        const first = fieldOrder.find((name) => found[name])
        if (first) {
          const element = document.getElementById(fieldElementId(first, kind))
          element?.focus({ preventScroll: true })
          element?.scrollIntoView({ block: "center", behavior: "smooth" })
          return
        }

        startTransition(async () => {
          try {
            const result = await action(formData)

            if (result.success) {
              toast.success(successMessage)
              setRequestId(crypto.randomUUID())
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-4">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.amount) || undefined}>
            <FieldLabel htmlFor="transaction-amount">
              Số tiền <RequiredMark />
            </FieldLabel>
            <CurrencyInput
              id="transaction-amount"
              name="amount"
              value={amountPick.amount}
              onValueChange={(value) => {
                amountPick.onType(value)
                clearError("amount")
              }}
              invalid={Boolean(errors.amount)}
              required
            />
            <AmountSuggestions
              suggestions={amountPick.suggestions}
              value={amountPick.amount}
              onSelect={(value) => {
                amountPick.onPick(value)
                clearError("amount")
              }}
            />
            {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}
          </Field>

          {transactionKinds.map((formKind) => {
            const fieldProps = {
              accounts,
              categoryGroups,
              defaultValues: defaultValues?.kind === formKind ? defaultValues : undefined,
              errors: formKind === kind ? errors : {},
              onFieldChange: clearError,
              onManageCategories,
            }

            return (
              // `contents` keeps the fields in the group's layout.
              <fieldset
                key={formKind}
                disabled={formKind !== kind}
                className={formKind === kind ? "contents" : "hidden"}
              >
                {formKind === "transfer" ? (
                  <TransferFields {...fieldProps} />
                ) : (
                  <CashFlowFields {...fieldProps} kind={formKind} />
                )}
              </fieldset>
            )
          })}

          <DateTimeFields
            idPrefix="transaction"
            label={<>Thời gian <RequiredMark /></>}
            // The server accepts 2000 through today (Vietnam time).
            minDate="2000-01-01"
            maxDate={toDateKey(new Date())}
            defaultDate={defaultDateTime?.date}
            defaultTime={defaultDateTime?.time}
            onDateChange={() => clearError("date")}
            onTimeChange={() => clearError("date")}
            error={errors.date}
            required
          />

          <Field>
            <FieldLabel htmlFor="transaction-note">Ghi chú</FieldLabel>
            <Textarea
              id="transaction-note"
              name="note"
              defaultValue={defaultValues?.note}
            />
          </Field>
        </FieldGroup>
      </div>
      <SheetFooter>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        {/* Back is in the header, so the footer only saves. */}
        <Button type="submit" className="w-full" disabled={isPending || blocked}>
          {isPending ? (
            <LoaderCircleIcon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isPending ? "Đang lưu..." : submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}
