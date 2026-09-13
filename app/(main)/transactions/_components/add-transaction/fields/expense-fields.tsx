import { CashFlowFields } from "./cash-flow-fields"
import type { TransactionFieldProps } from "../form-types"

export function ExpenseFields(props: TransactionFieldProps) {
  return (
    <CashFlowFields
      {...props}
      idPrefix="expense"
      notePlaceholder="Thêm ghi chú cho khoản chi..."
    />
  )
}
