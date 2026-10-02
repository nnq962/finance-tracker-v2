"use client"

import { AiAssistDrawer } from "@/components/ai-assist/ai-assist-drawer"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { mockParseTransaction } from "../../_lib/mock-ai-parse"
import { TransactionMadLibs } from "./transaction-mad-libs"

const examples = [
  "Ăn trưa 45k",
  "Hôm qua đổ xăng 80 nghìn",
  "Nhận lương 25 triệu",
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
