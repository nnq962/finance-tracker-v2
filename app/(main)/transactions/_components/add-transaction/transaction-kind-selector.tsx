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
} from "@/components/animate-ui/components/radix/tabs"

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
        className="grid h-auto w-full grid-cols-2 sm:grid-cols-4"
        aria-label="Loại giao dịch"
      >
        {transactionKinds.map(({ value: kind, label, icon: Icon }) => (
          <TabsTrigger
            key={kind}
            value={kind}
            disabled={kind === "loan"}
            title={kind === "loan" ? "Sẽ khả dụng khi hoàn thiện Vay nợ" : undefined}
          >
            <Icon />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
