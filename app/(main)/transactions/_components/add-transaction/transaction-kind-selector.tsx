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
  value: TransactionKind
  onValueChange: (value: TransactionKind) => void
}

export function TransactionKindSelector({
  value,
  onValueChange,
}: TransactionKindSelectorProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) =>
        onValueChange(nextValue as TransactionKind)
      }
      className="w-full"
    >
      <TabsList
        className="grid h-auto w-full grid-cols-2 sm:grid-cols-4"
        aria-label="Loại giao dịch"
      >
        {transactionKinds.map(({ value: kind, label, icon: Icon }) => (
          <TabsTrigger key={kind} value={kind}>
            <Icon />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
