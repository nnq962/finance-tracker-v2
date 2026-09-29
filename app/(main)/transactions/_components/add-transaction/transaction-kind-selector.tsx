import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"

import type { TransactionKind } from "../../_types/transaction"
import type { SupportedTransactionKind } from "@/lib/transactions/types"

const transactionKinds: Array<{
  value: TransactionKind
  label: string
}> = [
  { value: "expense", label: "Chi tiền" },
  { value: "income", label: "Thu tiền" },
  { value: "transfer", label: "Chuyển khoản" },
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
      <TabsList className="w-full" aria-label="Loại giao dịch">
        {transactionKinds.map(({ value: kind, label }) => (
          <TabsTrigger key={kind} value={kind}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
