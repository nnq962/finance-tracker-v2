import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Repeat2Icon,
} from "lucide-react"

import type { TransactionKind } from "../_types/transaction"

export const cashFlowColors = {
  income: {
    text: "text-[#3e9727] dark:text-[#94e379]",
    dot: "bg-[#6ecc49]",
    surface: "bg-[#dbf9d2] text-[#3e9727] dark:bg-[#203e1a] dark:text-[#94e379]",
  },
  expense: {
    text: "text-[#c8393a] dark:text-[#ff9b93]",
    dot: "bg-[#ff645f]",
    surface: "bg-[#ffe5e1] text-[#c8393a] dark:bg-[#542523] dark:text-[#ff9b93]",
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
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amountClassName: "text-blue-600 dark:text-blue-400",
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
