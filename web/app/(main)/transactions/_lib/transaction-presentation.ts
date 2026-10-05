import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  HandCoinsIcon,
  Repeat2Icon,
} from "lucide-react"

import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import type { Transaction, TransactionKind } from "../_types/transaction"

export const cashFlowColors = {
  income: {
    text: "text-income",
    dot: "bg-income",
    surface: "bg-income-soft text-income",
  },
  expense: {
    text: "text-expense",
    dot: "bg-expense",
    surface: "bg-expense-soft text-expense",
  },
} as const

export const transactionPresentation = {
  expense: {
    label: "Chi tiền",
    icon: ArrowUpRightIcon,
    iconClassName: cashFlowColors.expense.surface,
    amountClassName: cashFlowColors.expense.text,
  },
  income: {
    label: "Thu tiền",
    icon: ArrowDownLeftIcon,
    iconClassName: cashFlowColors.income.surface,
    amountClassName: cashFlowColors.income.text,
  },
  transfer: {
    label: "Chuyển khoản",
    icon: Repeat2Icon,
    iconClassName: "bg-transfer-soft text-transfer",
    amountClassName: "text-transfer",
  },
} satisfies Record<
  TransactionKind,
  {
    label: string
    icon: typeof ArrowUpRightIcon
    iconClassName: string
    amountClassName: string
  }
>

/**
 * A transaction's category, with the icon and colour it shows in a list:
 * the category's own; loans, transfers and unknown categories fall back to
 * an icon for their kind.
 */
export function getTransactionVisual(transaction: Transaction, categoryGroups: CategoryGroup[]) {
  const category = transaction.categoryId
    ? categoryGroups
        .find((group) => group.id === transaction.categoryGroupId)
        ?.items.find((item) => item.id === transaction.categoryId) ??
      categoryGroups
        .flatMap((group) => group.items)
        .find((item) => item.id === transaction.categoryId)
    : undefined
  const icon = category
    ? categoryIconRegistry[category.iconName]
    : transaction.source === "debt"
      ? HandCoinsIcon
      : transactionPresentation[transaction.kind].icon
  const color: CategoryColorName = category
    ? category.colorName
    : transaction.kind === "transfer"
      ? "blue"
      : transaction.kind === "income"
        ? "emerald"
        : "rose"
  return { category, icon, color }
}
