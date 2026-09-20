import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Repeat2Icon,
} from "lucide-react"

import type { TransactionKind } from "../_types/transaction"

export const transactionPresentation = {
  expense: {
    label: "Chi tiền",
    icon: ArrowUpRightIcon,
    iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    amountClassName: "text-rose-600 dark:text-rose-400",
  },
  income: {
    label: "Thu tiền",
    icon: ArrowDownLeftIcon,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amountClassName: "text-emerald-600 dark:text-emerald-400",
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
