import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  Repeat2Icon,
} from "lucide-react"

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { TransactionKind } from "../../_types/transaction"
import type { SupportedTransactionKind } from "@/lib/transactions/types"

const transactionKinds: Array<{
  value: TransactionKind
  label: string
  icon: typeof ArrowUpRightIcon
}> = [
  { value: "expense", label: "Chi tiền", icon: ArrowUpRightIcon },
  { value: "income", label: "Thu tiền", icon: ArrowDownLeftIcon },
  { value: "transfer", label: "Chuyển khoản", icon: Repeat2Icon },
]

type TransactionKindSelectorProps = {
  value: SupportedTransactionKind
  onValueChange: (value: SupportedTransactionKind) => void
}

export function TransactionKindSelector({
  value,
  onValueChange,
}: TransactionKindSelectorProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) =>
        onValueChange(nextValue as SupportedTransactionKind)
      }
      className="w-full"
    >
      <TabsList
        variant="default"
        className="grid w-full grid-cols-3"
        aria-label="Loại giao dịch"
      >
        {transactionKinds.map(({ value: kind, label, icon: Icon }) => (
          <Tooltip key={kind}>
            <TooltipTrigger asChild>
              <span className="flex h-full">
                <TabsTrigger
                  value={kind}
                  aria-label={label}
                  className="h-full w-full"
                >
                  <Icon />
                  <span className="sr-only">{label}</span>
                </TabsTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  )
}
