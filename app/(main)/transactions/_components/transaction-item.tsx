import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  HandshakeIcon,
  Repeat2Icon,
} from "lucide-react"

import { formatCurrency } from "@/lib/format-currency"

import type { Transaction, TransactionKind } from "../_types/transaction"

const kindPresentation: Record<
  TransactionKind,
  {
    icon: typeof ArrowUpRightIcon
    iconClassName: string
    amountClassName: string
  }
> = {
  expense: {
    icon: ArrowUpRightIcon,
    iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    amountClassName: "text-rose-600 dark:text-rose-400",
  },
  income: {
    icon: ArrowDownLeftIcon,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amountClassName: "text-emerald-600 dark:text-emerald-400",
  },
  transfer: {
    icon: Repeat2Icon,
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amountClassName: "text-blue-600 dark:text-blue-400",
  },
  loan: {
    icon: HandshakeIcon,
    iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    amountClassName: "text-amber-600 dark:text-amber-400",
  },
}

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
})

type TransactionItemProps = {
  transaction: Transaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const presentation = kindPresentation[transaction.kind]
  const Icon = presentation.icon
  const signDisplay = transaction.kind === "transfer" ? "never" : "always"

  return (
    <article className="flex items-center gap-3 py-3 sm:gap-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${presentation.iconClassName}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium">{transaction.title}</h3>
        <p className="truncate text-sm text-muted-foreground">
          {transaction.description}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-semibold tabular-nums ${presentation.amountClassName}`}>
          {formatCurrency(transaction.amount, { signDisplay })}
        </p>
        <time
          className="text-xs text-muted-foreground"
          dateTime={transaction.occurredAt}
        >
          {timeFormatter.format(new Date(transaction.occurredAt))}
        </time>
      </div>
    </article>
  )
}
