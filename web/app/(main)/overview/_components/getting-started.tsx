"use client"

import * as React from "react"
import {
  BellRingIcon,
  CheckIcon,
  DownloadIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { AddAccountSheet } from "@/app/(main)/budget/_components/add-account/add-account-sheet"
import { IosInstallDialog, usePwaInstall } from "@/components/pwa-install-button"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { hideChecklistAction } from "@/lib/onboarding/actions"
import type { ChecklistState } from "@/lib/onboarding/repository"

import { AddTransactionSheet } from "../../transactions/_components/add-transaction/add-transaction-sheet"

type Step = {
  key: string
  icon: LucideIcon
  color: CategoryColorName
  title: string
  description: string
  done: boolean
  onClick?: () => void
}

type GettingStartedProps = {
  state: ChecklistState
  accounts: Account[]
  categoryGroups: CategoryGroup[]
}

/**
 * The first steps, ticked from what the user has already done. It hides once
 * every step is done, or when the user hides it.
 */
export function GettingStarted({ state, accounts, categoryGroups }: GettingStartedProps) {
  const router = useRouter()
  const [hidden, setHidden] = React.useState(state.hidden)
  const [addAccountOpen, setAddAccountOpen] = React.useState(false)
  const [addTransactionOpen, setAddTransactionOpen] = React.useState(false)
  const [installGuideOpen, setInstallGuideOpen] = React.useState(false)
  const { available, isStandalone, isIOS, install } = usePwaInstall()

  const steps: Step[] = [
    {
      key: "account",
      icon: WalletCardsIcon,
      color: "blue",
      title: "Thêm tài khoản đầu tiên",
      description: "Tiền mặt, ngân hàng hoặc ví điện tử.",
      done: state.hasAccount,
      onClick: () => setAddAccountOpen(true),
    },
    {
      key: "transaction",
      icon: ReceiptTextIcon,
      color: "orange",
      title: "Ghi giao dịch đầu tiên",
      description: state.hasAccount ? "Một khoản chi hoặc thu bất kỳ." : "Cần có tài khoản trước.",
      done: state.hasTransaction,
      onClick: state.hasAccount ? () => setAddTransactionOpen(true) : undefined,
    },
    {
      key: "reminder",
      icon: BellRingIcon,
      color: "amber",
      title: "Bật nhắc ghi chi tiêu",
      description: "Một lời nhắc mỗi tối.",
      done: state.reminderOn,
      onClick: () => router.push("/settings?screen=notifications"),
    },
    // Only where the app can be installed, or already is.
    ...(available || isStandalone
      ? [{
          key: "install",
          icon: DownloadIcon,
          color: "emerald" as const,
          title: "Cài app lên màn hình chính",
          description: "Mở nhanh như một ứng dụng.",
          done: isStandalone,
          onClick: () => (isIOS ? setInstallGuideOpen(true) : void install()),
        }]
      : []),
  ]
  const doneCount = steps.filter((step) => step.done).length

  if (hidden || doneCount === steps.length) return null

  return (
    <>
      <SettingsGroup
        title={`Bắt đầu · ${doneCount}/${steps.length}`}
        action={
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setHidden(true)
              void hideChecklistAction().catch(() => {})
            }}
          >
            Ẩn
          </Button>
        }
      >
        {steps.map((step) => (
          <SettingsRow
            key={step.key}
            icon={step.done ? CheckIcon : step.icon}
            color={step.done ? "emerald" : step.color}
            title={step.title}
            description={step.done ? "Đã xong" : step.description}
            onClick={step.done ? undefined : step.onClick}
          />
        ))}
      </SettingsGroup>
      <AddAccountSheet open={addAccountOpen} onOpenChange={setAddAccountOpen} />
      <AddTransactionSheet
        accounts={accounts}
        categoryGroups={categoryGroups}
        open={addTransactionOpen}
        onOpenChange={setAddTransactionOpen}
      />
      {isIOS ? <IosInstallDialog open={installGuideOpen} onOpenChange={setInstallGuideOpen} /> : null}
    </>
  )
}
