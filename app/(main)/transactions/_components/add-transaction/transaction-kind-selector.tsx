import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  HandshakeIcon,
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
  { value: "loan", label: "Vay nợ", icon: HandshakeIcon },
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
      onValueChange={(nextValue) => {
        if (nextValue !== "loan") {
          onValueChange(nextValue as SupportedTransactionKind)
        }
      }}
      className="w-full"
    >
      <TabsList
        variant="default"
        className="grid w-full grid-cols-4"
        aria-label="Loại giao dịch"
      >
        {transactionKinds.map(({ value: kind, label, icon: Icon }) => {
          const isDisabled = kind === "loan"

          return (
            <Tooltip key={kind}>
              <TooltipTrigger asChild>
                <span className="flex">
                  <TabsTrigger
                    value={kind}
                    disabled={isDisabled}
                    aria-label={label}
                    className="w-full"
                  >
                    <Icon />
                    <span className="sr-only">{label}</span>
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {label}{isDisabled ? " · Sắp có" : ""}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
