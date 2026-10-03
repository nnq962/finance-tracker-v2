"use client"

import * as React from "react"
import {
  ArrowLeftRightIcon,
  BellRingIcon,
  CheckIcon,
  DownloadIcon,
  GiftIcon,
  HandCoinsIcon,
  LoaderCircleIcon,
  ReceiptTextIcon,
  SparklesIcon,
  TagsIcon,
  UserPlusIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { AddAccountSheet } from "@/app/(main)/budget/_components/add-account/add-account-sheet"
import { AddContactSheet } from "@/app/(main)/debts/_components/add-contact-sheet"
import { AddDebtSheet } from "@/app/(main)/debts/_components/add-debt-sheet"
import { createContactAction, createDebtAction } from "@/app/(main)/debts/actions"
import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { IosInstallDialog, usePwaInstall } from "@/components/pwa-install-button"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Account } from "@/lib/accounts/types"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Contact, NewContact, NewDebt } from "@/lib/debts/types"
import { claimMissionRewardAction } from "@/lib/onboarding/actions"
import { MISSION_REWARD, type MissionKey, type MissionState } from "@/lib/onboarding/missions"

import { AddTransactionSheet } from "../../transactions/_components/add-transaction/add-transaction-sheet"

type Mission = {
  key: MissionKey
  icon: LucideIcon
  color: CategoryColorName
  title: string
  description: string
  done: boolean
  /** Where the mission is done: a sheet here, or the page that does it. */
  start: () => void
}

type MissionsProps = {
  state: MissionState
  accounts: Account[]
  contacts: Contact[]
  categoryGroups: CategoryGroup[]
}

type OpenSheet = "account" | "transaction" | "transfer" | "contact" | "debt" | "category" | null

/** Throws a failed server action's message, as the sheets expect. */
function unwrap<T>(result: { success: true; data: T } | { success: false; error: string }) {
  if (!result.success) throw new Error(result.error)
  return result.data
}

/**
 * Missions that walk a new user through the app, each worth AI credits once
 * done and claimed. They cannot be hidden, and leave once every reward is in.
 */
export function Missions({ state, accounts, contacts, categoryGroups }: MissionsProps) {
  const router = useRouter()
  const [sheet, setSheet] = React.useState<OpenSheet>(null)
  const [installGuideOpen, setInstallGuideOpen] = React.useState(false)
  // Claimed here before the page reloads with them.
  const [claimedNow, setClaimedNow] = React.useState<MissionKey[]>([])
  const [claiming, setClaiming] = React.useState<MissionKey | null>(null)
  const { available, isStandalone, isIOS, install } = usePwaInstall()

  const hasAccount = accounts.length > 0
  const needAccount = "Cần có tài khoản trước."
  const sheetProps = (name: Exclude<OpenSheet, null>) => ({
    open: sheet === name,
    onOpenChange: (open: boolean) => {
      setSheet(open ? name : null)
      // What was just added may finish a mission.
      if (!open) router.refresh()
    },
  })

  const missions: Mission[] = [
    {
      key: "account",
      icon: WalletCardsIcon,
      color: "blue",
      title: "Thêm tài khoản đầu tiên",
      description: "Tiền mặt, ngân hàng hoặc ví điện tử.",
      done: state.done.account,
      start: () => setSheet("account"),
    },
    {
      key: "transaction",
      icon: ReceiptTextIcon,
      color: "orange",
      title: "Ghi giao dịch đầu tiên",
      description: hasAccount ? "Một khoản chi hoặc thu bất kỳ." : needAccount,
      done: state.done.transaction,
      start: () => setSheet(hasAccount ? "transaction" : "account"),
    },
    {
      key: "ai",
      icon: SparklesIcon,
      color: "violet",
      title: "Ghi giao dịch bằng trợ lý AI",
      description: hasAccount ? "Gõ hoặc nói một câu, AI điền giúp bạn." : needAccount,
      done: state.done.ai,
      start: () => (hasAccount ? router.push("/transactions?ai=1") : setSheet("account")),
    },
    {
      key: "transfer",
      icon: ArrowLeftRightIcon,
      color: "cyan",
      title: "Chuyển tiền giữa hai tài khoản",
      description: accounts.length >= 2 ? "Ví dụ rút tiền từ ngân hàng ra ví." : "Cần có ít nhất 2 tài khoản.",
      done: state.done.transfer,
      start: () => setSheet(accounts.length >= 2 ? "transfer" : "account"),
    },
    {
      key: "contact",
      icon: UserPlusIcon,
      color: "pink",
      title: "Thêm một người vào danh bạ",
      description: "Người bạn hay cho vay hoặc vay tiền.",
      done: state.done.contact,
      start: () => setSheet("contact"),
    },
    {
      key: "debt",
      icon: HandCoinsIcon,
      color: "rose",
      title: "Ghi một khoản vay hoặc cho vay",
      description: "Theo dõi ai nợ bạn và bạn nợ ai.",
      done: state.done.debt,
      start: () => setSheet("debt"),
    },
    {
      key: "category",
      icon: TagsIcon,
      color: "lime",
      title: "Tạo một hạng mục riêng",
      description: "Phân loại chi tiêu theo cách của bạn.",
      done: state.done.category,
      start: () => setSheet("category"),
    },
    {
      key: "reminder",
      icon: BellRingIcon,
      color: "amber",
      title: "Bật nhắc ghi chi tiêu",
      description: "Một lời nhắc mỗi tối.",
      done: state.done.reminder,
      start: () => router.push("/settings?screen=notifications"),
    },
    // Only where the app can be installed, or already is.
    ...(available || isStandalone
      ? [{
          key: "install" as const,
          icon: DownloadIcon,
          color: "emerald" as const,
          title: "Cài app lên màn hình chính",
          description: "Mở nhanh như một ứng dụng.",
          done: isStandalone,
          start: () => (isIOS ? setInstallGuideOpen(true) : void install()),
        }]
      : []),
  ]

  const claimed = new Set([...state.claimed, ...claimedNow])
  const isClaimed = (mission: Mission) => claimed.has(mission.key)
  const claimedCount = missions.filter(isClaimed).length
  if (claimedCount === missions.length) return null

  // Rewards waiting first, then what is left in order, then what is finished.
  const rank = (mission: Mission) => (isClaimed(mission) ? 2 : mission.done ? 0 : 1)
  const ordered = [...missions].sort((a, b) => rank(a) - rank(b))

  const claim = async (mission: Mission) => {
    setClaiming(mission.key)
    const result = await claimMissionRewardAction(mission.key, mission.done)
    setClaiming(null)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setClaimedNow((keys) => [...keys, mission.key])
    toast.success(`+${MISSION_REWARD} lượt AI`, {
      description: `Bạn đang có ${result.aiCredits} lượt thưởng, dùng khi hết lượt của tháng.`,
    })
    router.refresh()
  }

  return (
    <>
      <SettingsGroup
        title={`Nhiệm vụ · ${claimedCount}/${missions.length}`}
        action={
          <Badge variant="sun">
            <GiftIcon data-icon="inline-start" aria-hidden="true" />
            {claimedCount * MISSION_REWARD}/{missions.length * MISSION_REWARD} lượt AI
          </Badge>
        }
        header={
          <div className="space-y-2.5 px-4 pt-3.5 pb-2">
            <p className="text-sm text-muted-foreground">
              Làm quen với app, mỗi nhiệm vụ hoàn thành được tặng {MISSION_REWARD} lượt trợ lý AI.
            </p>
            <Progress
              value={(claimedCount / missions.length) * 100}
              tone="sun"
              aria-label="Nhiệm vụ đã hoàn thành"
            />
          </div>
        }
      >
        {ordered.map((mission) =>
          isClaimed(mission) ? (
            <SettingsRow
              key={mission.key}
              icon={CheckIcon}
              color="emerald"
              title={mission.title}
              description={`Đã nhận ${MISSION_REWARD} lượt AI`}
            />
          ) : mission.done ? (
            <SettingsRow
              key={mission.key}
              icon={mission.icon}
              color={mission.color}
              title={mission.title}
              description="Đã xong, nhận thưởng nhé!"
              action={
                <Button type="button" size="sm" disabled={claiming !== null} onClick={() => void claim(mission)}>
                  {claiming === mission.key ? (
                    <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
                  ) : null}
                  Nhận +{MISSION_REWARD}
                </Button>
              }
            />
          ) : (
            <SettingsRow
              key={mission.key}
              icon={mission.icon}
              color={mission.color}
              title={mission.title}
              description={mission.description}
              value={<Badge variant="sun">+{MISSION_REWARD}</Badge>}
              onClick={mission.start}
            />
          ),
        )}
      </SettingsGroup>

      <AddAccountSheet {...sheetProps("account")} />
      <AddTransactionSheet accounts={accounts} categoryGroups={categoryGroups} {...sheetProps("transaction")} />
      <AddTransactionSheet
        accounts={accounts}
        categoryGroups={categoryGroups}
        initialKind="transfer"
        {...sheetProps("transfer")}
      />
      <AddContactSheet
        {...sheetProps("contact")}
        onAddContact={async (values: NewContact) => {
          const contact = unwrap(await createContactAction(values, crypto.randomUUID()))
          toast.success("Đã thêm người liên hệ.")
          return contact
        }}
      />
      <AddDebtSheet
        {...sheetProps("debt")}
        accounts={accounts}
        contacts={contacts}
        onAddDebt={async (values: NewDebt) => {
          unwrap(await createDebtAction(values, crypto.randomUUID()))
          toast.success(
            values.recordingMode === "opening"
              ? "Đã ghi nhận nợ có sẵn. Số dư tài khoản giữ nguyên."
              : "Đã tạo khoản nợ và cập nhật số dư.",
          )
        }}
        onAddContact={async (values: NewContact) => unwrap(await createContactAction(values, crypto.randomUUID()))}
      />
      <CategoryManagementSheet groups={categoryGroups} {...sheetProps("category")} />
      {isIOS ? <IosInstallDialog open={installGuideOpen} onOpenChange={setInstallGuideOpen} /> : null}
    </>
  )
}
