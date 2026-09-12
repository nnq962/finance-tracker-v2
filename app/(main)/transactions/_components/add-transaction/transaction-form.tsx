import { SaveIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import { SheetFooter } from "@/components/ui/sheet"

import type { TransactionKind } from "../../_types/transaction"
import { ExpenseFields } from "./fields/expense-fields"
import { IncomeFields } from "./fields/income-fields"
import { LoanFields } from "./fields/loan-fields"
import { TransferFields } from "./fields/transfer-fields"

const specificFields: Record<TransactionKind, React.ComponentType> = {
  expense: ExpenseFields,
  income: IncomeFields,
  transfer: TransferFields,
  loan: LoanFields,
}

type TransactionFormProps = {
  kind: TransactionKind
  onSubmit: () => void
}

export function TransactionForm({ kind, onSubmit }: TransactionFormProps) {
  const SpecificFields = specificFields[kind]

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <SpecificFields />
      </div>
      <SheetFooter>
        <Button type="submit">
          <SaveIcon />
          Lưu giao dịch
        </Button>
      </SheetFooter>
    </form>
  )
}
