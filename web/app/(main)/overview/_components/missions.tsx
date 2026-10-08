"use client"

import * as React from "react"
import {
  ArrowLeftRightIcon,
  BellRingIcon,
  ChevronDownIcon,
  DownloadIcon,
  HandCoinsIcon,
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
import { CardLabel } from "@/components/app/card-label"
import { ProgressRing } from "@/components/app/progress-ring"
import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { IosInstallDialog, usePwaInstall } from "@/components/pwa-install-button"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Account } from "@/lib/accounts/types"
import type { IconTileTone } from "@/components/app/icon-tile"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Contact, NewContact, NewDebt } from "@/lib/debts/types"
import { claimMissionRewardAction } from "@/lib/onboarding/actions"
import { MISSION_REWARD, type MissionKey, type MissionState } from "@/lib/onboarding/missions"

import { cn } from "@/lib/utils"

import { AddTransactionSheet } from "../../transactions/_components/add-transaction/add-transaction-sheet"

type Mission = {
  key: MissionKey
  icon: LucideIcon
  color: IconTileTone
  title: string
  /** Only what the title does not say, or what is needed first. */
  description?: string
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
  // Folded by default: the progress shows, and rewards waiting to be claimed.
  const [expanded, setExpanded] = React.useState(false)
  const { available, isStandalone, isIOS, install } = usePwaInstall()

  const hasAccount = accounts.length > 0
  const needAccount = "Cần thêm tài khoản trước"
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
      title: "Thêm tài khoản",
      description: "Tiền mặt, ngân hàng hoặc ví",
      done: state.done.account,
      start: () => setSheet("account"),
    },
    {
      key: "transaction",
      icon: ReceiptTextIcon,
      color: "orange",
      title: "Ghi giao dịch đầu tiên",
      description: hasAccount ? undefined : needAccount,
      done: state.done.transaction,
      start: () => setSheet(hasAccount ? "transaction" : "account"),
    },
    {
      key: "ai",
      icon: SparklesIcon,
      color: "ai",
      title: "Ghi giao dịch bằng AI",
      description: hasAccount ? "Gõ hoặc nói một câu" : needAccount,
      done: state.done.ai,
      start: () => (hasAccount ? router.push("/transactions?ai=1") : setSheet("account")),
    },
    {
      key: "transfer",
      icon: ArrowLeftRightIcon,
      color: "cyan",
      title: "Chuyển tiền giữa hai tài khoản",
      description: accounts.length >= 2 ? undefined : "Cần 2 tài khoản trở lên",
      done: state.done.transfer,
      start: () => setSheet(accounts.length >= 2 ? "transfer" : "account"),
    },
    {
      key: "contact",
      icon: UserPlusIcon,
      color: "pink",
      title: "Thêm người liên hệ",
      done: state.done.contact,
      start: () => setSheet("contact"),
    },
    {
      key: "debt",
      icon: HandCoinsIcon,
      color: "rose",
      title: "Ghi khoản vay hoặc cho vay",
      done: state.done.debt,
      start: () => setSheet("debt"),
    },
    {
      key: "category",
      icon: TagsIcon,
      color: "lime",
      title: "Tạo hạng mục riêng",
      done: state.done.category,
      start: () => setSheet("category"),
    },
    {
      key: "reminder",
      icon: BellRingIcon,
      color: "amber",
      title: "Bật nhắc ghi chi tiêu",
      done: state.done.reminder,
      start: () => router.push("/settings?screen=notifications"),
    },
    // Only where the app can be installed, or already is.
    ...(available || isStandalone
      ? [{
          key: "install" as const,
          icon: DownloadIcon,
          color: "emerald" as const,
          title: "Cài ứng dụng lên màn hình chính",
          done: isStandalone,
          start: () => (isIOS ? setInstallGuideOpen(true) : void install()),
        }]
      : []),
  ]

  const claimed = new Set([...state.claimed, ...claimedNow])
  const isClaimed = (mission: Mission) => claimed.has(mission.key)
  const claimedCount = missions.filter(isClaimed).length
  if (claimedCount === missions.length) return null

  // Claimed missions leave the list; rewards waiting come first and always
  // show, the rest only when unfolded.
  const claimable = missions.filter((mission) => mission.done && !isClaimed(mission))
  const remaining = missions.filter((mission) => !mission.done && !isClaimed(mission))
  const shown = expanded ? [...claimable, ...remaining] : claimable

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
      description: `Hiện có ${result.aiCredits} lượt thưởng`,
    })
    router.refresh()
  }

  return (
    <>
      <SettingsGroup
        size="lg"
        listClassName={shown.length > 0 ? "border-t" : undefined}
        header={
          <div className="flex items-center gap-4 p-6">
            <div className="min-w-0 flex-1">
              <CardLabel>Nhiệm vụ</CardLabel>
              <p className="mt-1.5 text-lg font-semibold">Nhận thêm lượt AI</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {claimable.length > 0
                  ? `${claimable.length} phần thưởng chờ nhận`
                  : `+${MISSION_REWARD} lượt cho mỗi nhiệm vụ`}
              </p>
              {remaining.length > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((open) => !open)}
                >
                  {expanded ? "Thu gọn" : "Xem nhiệm vụ"}
                  <ChevronDownIcon
                    data-icon="inline-end"
                    className={cn("transition-transform", expanded && "rotate-180")}
                    aria-hidden="true"
                  />
                </Button>
              ) : null}
            </div>
            <ProgressRing value={claimedCount} max={missions.length} label="đã xong" />
          </div>
        }
      >
        {shown.map((mission) =>
          mission.done ? (
            <SettingsRow
              key={mission.key}
              icon={mission.icon}
              tone={mission.color}
              title={mission.title}
              description="Đã xong"
              action={
                <Button
                  type="button"
                  size="sm"
                  disabled={claiming !== null}
                  onClick={() => void claim(mission)}
                >
                  {claiming === mission.key ? <Spinner /> : null}
                  Nhận +{MISSION_REWARD}
                </Button>
              }
            />
          ) : (
            <SettingsRow
              key={mission.key}
              icon={mission.icon}
              tone={mission.color}
              title={mission.title}
              description={mission.description}
              value={<Badge variant="secondary">+{MISSION_REWARD}</Badge>}
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
