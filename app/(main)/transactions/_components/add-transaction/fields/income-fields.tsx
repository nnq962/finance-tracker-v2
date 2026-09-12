import {
  BadgeDollarSignIcon,
  BriefcaseBusinessIcon,
  ChartNoAxesCombinedIcon,
  CircleEllipsisIcon,
  GiftIcon,
  WalletCardsIcon,
} from "lucide-react"

import { incomeSourceOptions } from "../../../_data/transaction-form-options"
import { CashFlowFields } from "./cash-flow-fields"

const categoryIcons = [
  WalletCardsIcon,
  BadgeDollarSignIcon,
  BriefcaseBusinessIcon,
  ChartNoAxesCombinedIcon,
  GiftIcon,
  CircleEllipsisIcon,
]

export function IncomeFields() {
  return (
    <CashFlowFields
      idPrefix="income"
      categories={incomeSourceOptions.map((label, index) => ({
        label,
        icon: categoryIcons[index],
      }))}
      notePlaceholder="Thêm ghi chú cho khoản thu..."
    />
  )
}
