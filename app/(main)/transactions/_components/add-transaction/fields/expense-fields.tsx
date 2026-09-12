import {
  CarFrontIcon,
  FilmIcon,
  HouseIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  UtensilsIcon,
} from "lucide-react"

import { expenseCategoryOptions } from "../../../_data/transaction-form-options"
import { CashFlowFields } from "./cash-flow-fields"

const categoryIcons = [
  UtensilsIcon,
  ShoppingBagIcon,
  ReceiptTextIcon,
  CarFrontIcon,
  FilmIcon,
  HouseIcon,
]

export function ExpenseFields() {
  return (
    <CashFlowFields
      idPrefix="expense"
      categories={expenseCategoryOptions.map((label, index) => ({
        label,
        icon: categoryIcons[index],
      }))}
      notePlaceholder="Thêm ghi chú cho khoản chi..."
    />
  )
}
