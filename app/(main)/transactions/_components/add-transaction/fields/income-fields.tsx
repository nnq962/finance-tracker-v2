import { CashFlowFields } from "./cash-flow-fields"
import type { TransactionFieldProps } from "../form-types"

export function IncomeFields(props: TransactionFieldProps) {
  return (
    <CashFlowFields
      {...props}
      idPrefix="income"
      notePlaceholder="Thêm ghi chú cho khoản thu..."
    />
  )
}
