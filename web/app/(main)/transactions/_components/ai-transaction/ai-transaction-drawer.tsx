"use client"

import { AiAssistDrawer } from "@/components/ai-assist/ai-assist-drawer"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { mockParseTransaction } from "../../_lib/mock-ai-parse"
import { TransactionMadLibs } from "./transaction-mad-libs"

const examples = [
  "Ăn trưa 45k bằng ví MoMo",
  "Hôm qua uống trà sữa lúc 4h chiều 80 cành bằng tiền mặt",
  "Sáng nay đổ xăng 100 nghìn quẹt thẻ Techcombank",
  "Nhận lương tháng 9 25 triệu vào Vietcombank",
]

type AiTransactionDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  todayDateKey: string
}

/** Records a transaction from a sentence. Not yet connected to the AI: a rule-based stand-in reads the request. */
export function AiTransactionDrawer({
  open,
  onOpenChange,
  accounts,
  categoryGroups,
  todayDateKey,
}: AiTransactionDrawerProps) {
  return (
    <AiAssistDrawer
      open={open}
      onOpenChange={onOpenChange}
      prompt="Nói một câu về khoản thu chi, AI sẽ điền giúp bạn."
      examples={examples}
      onSubmit={(text) =>
        mockParseTransaction(text, { accounts, categoryGroups, today: todayDateKey })
      }
      renderResult={(draft, { retry, close }) => (
        <TransactionMadLibs
          draft={draft}
          accounts={accounts}
          categoryGroups={categoryGroups}
          today={todayDateKey}
          onRetry={retry}
          onDone={close}
        />
      )}
    />
  )
}
