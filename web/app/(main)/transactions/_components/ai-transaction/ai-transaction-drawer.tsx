"use client"

import { AiAssistDrawer } from "@/components/ai-assist/ai-assist-drawer"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { parseTransactionWithAiAction } from "../../actions"
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
  quota: { remaining: number; limit: number }
  /** Called as each request goes to the AI, to count it against the quota. */
  onRequest: () => void
}

/** Records a transaction from a sentence, read by the local model on the server. */
export function AiTransactionDrawer({
  open,
  onOpenChange,
  accounts,
  categoryGroups,
  todayDateKey,
  quota,
  onRequest,
}: AiTransactionDrawerProps) {
  return (
    <AiAssistDrawer
      open={open}
      onOpenChange={onOpenChange}
      prompt="Nói một câu về khoản thu chi, AI sẽ điền giúp bạn."
      examples={examples}
      quota={quota}
      onSubmit={async (text) => {
        onRequest()
        const result = await parseTransactionWithAiAction(text)
        if (!result.success) throw new Error(result.error)
        return result.draft
      }}
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
