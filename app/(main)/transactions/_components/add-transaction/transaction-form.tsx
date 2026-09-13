"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { SheetFooter } from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type {
  SupportedTransactionKind,
  Transaction,
  TransactionActionResult,
} from "@/lib/transactions/types"

import { ExpenseFields } from "./fields/expense-fields"
import { IncomeFields } from "./fields/income-fields"
import { TransferFields } from "./fields/transfer-fields"
import type { TransactionFieldProps } from "./form-types"

const specificFields: Record<
  SupportedTransactionKind,
  React.ComponentType<TransactionFieldProps>
> = {
  expense: ExpenseFields,
  income: IncomeFields,
  transfer: TransferFields,
}

type TransactionFormProps = {
  accounts: Account[]
  action: (formData: FormData) => Promise<TransactionActionResult>
  categoryGroups: CategoryGroup[]
  defaultValues?: Transaction
  kind: SupportedTransactionKind
  onSuccess: () => void
  submitLabel?: string
  successMessage: string
}

export function TransactionForm({
  accounts,
  action,
  categoryGroups,
  defaultValues,
  kind,
  onSuccess,
  submitLabel = "Lưu giao dịch",
  successMessage,
}: TransactionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const SpecificFields = specificFields[kind]

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setErrorMessage(null)

        startTransition(async () => {
          try {
            const result = await action(formData)

            if (result.success) {
              toast.success(successMessage)
              onSuccess()
              router.refresh()
              return
            }

            setErrorMessage(result.error)
            toast.error(result.error)
          } catch {
            const message = "Không thể lưu giao dịch. Vui lòng thử lại."
            setErrorMessage(message)
            toast.error(message)
          }
        })
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <SpecificFields
          accounts={accounts}
          categoryGroups={categoryGroups}
          defaultValues={defaultValues}
        />
      </div>
      <SheetFooter>
        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
        <Button type="submit" disabled={isPending}>
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
