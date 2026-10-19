"use client"

import * as React from "react"
import {
  BellRingIcon,
  CalculatorIcon,
  CircleHelpIcon,
  GaugeIcon,
  HistoryIcon,
  MegaphoneIcon,
  ActivityIcon,
  MicIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SwatchBookIcon,
  TagsIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PageSheet } from "@/components/app/page-sheet"
import { BudgetAlertSettingsScreen, budgetAlertsSummary } from "@/components/budgets/budget-alert-settings"
import { BudgetProvider } from "@/components/budgets/budget-hint"
import { BudgetsSheet } from "@/components/budgets/budgets-sheet"
import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { PlanOverlay } from "@/components/plans/plan-overlay"
import { useWelcome } from "@/components/onboarding/welcome"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { TimiIcon } from "@/components/timi-icon"
import { TimiWordmark } from "@/components/timi-wordmark"
import { Switch } from "@/components/ui/switch"
import type { SessionUser } from "@/lib/auth/session"
import { isPerfDebugOn, setPerfDebug } from "@/components/perf-debug"
import { setBroadcastsEnabledAction } from "@/lib/broadcasts/actions"
import type { BroadcastScreenData } from "@/lib/broadcasts/types"
import type { BudgetOverview } from "@/lib/budgets/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import type { NotificationState } from "@/lib/notifications/types"
import type { AdminData } from "@/lib/plans/admin-data"
import type { PaymentOutcome } from "@/lib/plans/payos"
import { plans, type PlanState } from "@/lib/plans/plans"
import type { UserDataSummary } from "@/lib/user-data/repository"

import { AdminBroadcasts } from "./admin-broadcasts"
import { AdminScreenLoader } from "./admin-screen"
import { AiQuotaGroup } from "./ai-quota-group"
import { InstallAppRow } from "./install-app-row"
import { NotificationDevices } from "./notification-devices"
import { NotificationPreferences } from "./notification-preferences"
import { ProfileHeader } from "./profile-header"
import { ReleaseHistory } from "./release-history"
import { SalaryCalculator } from "./salary-calculator"
import { SignOutRow } from "./sign-out-row"
import { ThemeOptions, themeOptions, useThemeChoice } from "./theme-options"
import { VoiceLab } from "./voice-lab"
import { WipeDataGroup } from "./wipe-data"

/** Screens opened from the list, in a sheet that slides in from the side. */
const screens = {
  admin: {
    title: "Quản trị",
  },
  broadcasts: {
    title: "Gửi thông báo",
  },
  appearance: {
    title: "Giao diện",
  },
  notifications: {
    title: "Nhắc ghi chi tiêu",
  },
  devices: {
    title: "Thiết bị nhận thông báo",
  },
  budgetAlerts: {
    title: "Cảnh báo hạn mức",
  },
  voice: {
    title: "Thử giọng nói",
  },
  salary: {
    title: "Tính lương",
  },
  releases: {
    title: "Lịch sử phiên bản",
  },
} as const

export type Screen = keyof typeof screens

/**
 * Takes a deep link's ?screen= off the address once what it opened is
 * closed, so a reload or reopening the app does not open it again.
 */
function forgetScreenParam() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has("screen")) return
  url.searchParams.delete("screen")
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
}

/** The limits' row: the month's limit, else how many groups have one. */
function budgetsSummary(overview: BudgetOverview) {
  if (overview.total.limit !== null) return `${formatCompactCurrency(overview.total.limit, 1)}/tháng`
  const groups = overview.groups.filter((group) => group.limit !== null).length
  return groups ? `${groups} nhóm` : "Chưa đặt"
}


const noSubscribe = () => () => {}

type SettingsViewProps = {
  user: SessionUser
  notifications: NotificationState
  categoryGroups: CategoryGroup[]
  /** This month's spending limits, for their row and sheet. */
  budgets: BudgetOverview
  planState: PlanState
  /** What wiping the user's data would delete. */
  dataSummary: UserDataSummary
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /**
   * Only for admins: how many users and broadcasts waiting to go out, for the
   * rows. Their screens load the rest when opened; a new object after each
   * refresh tells the open admin screen to read again.
   */
  admin?: { users: number; scheduled: number }
  /** Opens this screen straight away, e.g. from the missions on the overview, or the plans back from payOS. */
  initialScreen?: Screen | "plan"
}

export function SettingsView({
  user,
  notifications,
  categoryGroups,
  budgets,
  planState,
  dataSummary,
  checkoutEnabled,
  paymentOutcome,
  admin,
  initialScreen,
}: SettingsViewProps) {
  const [sheetScreen, setSheetScreen] = React.useState<Screen | null>(
    initialScreen && initialScreen !== "plan" ? initialScreen : null,
  )
  const [planOpen, setPlanOpen] = React.useState(initialScreen === "plan")
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  const [budgetsOpen, setBudgetsOpen] = React.useState(false)
  // Summaries on the list follow changes made in the screens.
  const [reminder, setReminder] = React.useState(notifications.settings)
  const [devices, setDevices] = React.useState(notifications)
  const [news, setNews] = React.useState(notifications.broadcastsEnabled)
  // Kept once loaded, so the admin screens open again at once.
  const [adminData, setAdminData] = React.useState<AdminData>()
  const [broadcastData, setBroadcastData] = React.useState<BroadcastScreenData>()
  // Read from this device's storage: off on the server, then what the device says.
  const speedLog = React.useSyncExternalStore(noSubscribe, isPerfDebugOn, () => false)
  const { choice } = useThemeChoice()
  const { openWelcome } = useWelcome()
  const router = useRouter()

  const open = (screen: Screen) => setSheetScreen(screen)
  const isPro = planState.plan === "pro"
  // The design catalogue, like its page: for admins, and anyone on the dev server.
  const showDesign = Boolean(admin) || process.env.NODE_ENV !== "production"

  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case "admin":
        return admin ? <AdminScreenLoader data={adminData} version={admin} onLoad={setAdminData} /> : null
      case "broadcasts":
        return admin ? <AdminBroadcasts initial={broadcastData} onChange={setBroadcastData} /> : null
      case "appearance":
        return <ThemeOptions />
      case "notifications":
        return (
          <NotificationPreferences
            uid={user.uid}
            initialSettings={reminder}
            onSaved={setReminder}
          />
        )
      case "budgetAlerts": {
        const first = budgets.groups.find((group) => group.limit !== null)
        return (
          // Its row reads the page's limits, refreshed after each save
          // whichever screen it was made on (here or the limits sheet's).
          <BudgetAlertSettingsScreen
            initial={budgets.alerts}
            example={first ? { name: first.name, limit: first.limit! } : undefined}
          />
        )
      }
      case "devices":
        return (
          <NotificationDevices
            uid={user.uid}
            initialState={devices}
            onChange={setDevices}
          />
        )
      case "voice":
        return <VoiceLab />
      case "salary":
        return <SalaryCalculator />
      case "releases":
        return <ReleaseHistory />
    }
  }

  const toggleNews = async (next: boolean) => {
    setNews(next)
    const result = await setBroadcastsEnabledAction(next)
    if (result.success) {
      toast.success(next ? "Đã bật Tin từ Timi" : "Đã tắt Tin từ Timi")
    } else {
      setNews(!next)
      toast.error(result.error)
    }
  }
  const scheduledCount = broadcastData
    ? broadcastData.items.filter((item) => item.status === "scheduled").length
    : (admin?.scheduled ?? 0)

  const categoryCount = categoryGroups.reduce((total, group) => total + group.items.length, 0)
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")

  return (
    <>
      {/* One column at every width, as native settings are, so the groups
          keep their order down to signing out. From md up the page caps it
          and centres it, title and all (settingsPageClassName). */}
      <div className="grid gap-6 md:gap-8">
        {/* The person first, as Apple Account opens; the plan opens from Lượt AI below. */}
        <ProfileHeader
          name={user.name}
          email={user.email || undefined}
          avatar={user.avatar}
          initials={initials}
          isPro={isPro}
          planLabel={plans[planState.plan].label}
        />

        <AiQuotaGroup planState={planState} onOpenPlan={() => setPlanOpen(true)} />

        <SettingsGroup title="Chung">
          <SettingsRow
            icon={PaletteIcon}
            title="Giao diện"
            value={themeOptions.find((option) => option.value === choice)?.label}
            onClick={() => open("appearance")}
          />
          <SettingsRow
            icon={TagsIcon}
            title="Hạng mục"
            value={`${categoryCount} mục`}
            onClick={() => setCategoriesOpen(true)}
          />
          <SettingsRow icon={GaugeIcon} title="Hạn mức chi tiêu" value={budgetsSummary(budgets)} onClick={() => setBudgetsOpen(true)} />
        </SettingsGroup>

        <SettingsGroup
          title="Thông báo"
          footer="Tin từ Timi: tính năng mới, ưu đãi, thông tin quan trọng. Tắt thì tin vẫn hiện trong chuông, chỉ không đẩy tới máy."
        >
          <SettingsRow
            icon={BellRingIcon}
            title="Nhắc ghi chi tiêu"
            value={reminder.notificationsEnabled ? `Bật · ${reminder.dailyReminderTime}` : "Tắt"}
            onClick={() => open("notifications")}
          />
          {/* Not "Hạn mức chi tiêu" again: Chung has that row, for the limits themselves. */}
          <SettingsRow icon={GaugeIcon} title="Cảnh báo hạn mức" value={budgetAlertsSummary(budgets.alerts)} onClick={() => open("budgetAlerts")} />
          <SettingsRow
            icon={SmartphoneIcon}
            // The group's caption already says THÔNG BÁO; the screen keeps the full name.
            title="Thiết bị"
            value={devices.devices.length > 0 ? String(devices.devices.length) : "Chưa có"}
            onClick={() => open("devices")}
          />
          <SettingsRow
            icon={MegaphoneIcon}
            title="Tin từ Timi"
            action={<Switch aria-label="Tin từ Timi" checked={news} onCheckedChange={(next) => void toggleNews(next)} />}
          />
        </SettingsGroup>

        <SettingsGroup
          title="Ứng dụng"
        >
          <SettingsRow
            icon={CalculatorIcon}
            title="Tính lương"
            onClick={() => open("salary")}
          />
          <SettingsRow
            icon={CircleHelpIcon}
            title="Hướng dẫn sử dụng"
            onClick={openWelcome}
          />
          <InstallAppRow />
        </SettingsGroup>

        {/* Tools for the people running the app, after the user's own
            settings: the admin's, the design catalogue among them (on the dev
            server for anyone). */}
        {admin || showDesign ? (
          <SettingsGroup title={admin ? "Quản trị" : "Nhà phát triển"}>
            {admin ? (
              <>
                <SettingsRow
                  icon={ShieldCheckIcon}
                  title="Người dùng & gói"
                  value={String(admin.users)}
                  onClick={() => open("admin")}
                />
                <SettingsRow
                  icon={MegaphoneIcon}
                  title="Gửi thông báo"
                  value={scheduledCount > 0 ? `${scheduledCount} đã hẹn` : undefined}
                  onClick={() => open("broadcasts")}
                />
                {/* The on-screen speed log (?debug=1), which an installed app has no address bar for. */}
                <SettingsRow
                  icon={ActivityIcon}
                  title="Ghi tốc độ"
                  action={<Switch aria-label="Ghi tốc độ" checked={speedLog} onCheckedChange={setPerfDebug} />}
                />
                {/* A tool for checking speech recognition on a device, not for users. */}
                <SettingsRow
                  icon={MicIcon}
                  title="Thử giọng nói"
                  onClick={() => open("voice")}
                />
                <SettingsRow
                  icon={HistoryIcon}
                  title="Lịch sử phiên bản"
                  value={process.env.NEXT_PUBLIC_APP_VERSION}
                  onClick={() => open("releases")}
                />
              </>
            ) : null}
            {showDesign ? (
              <SettingsRow icon={SwatchBookIcon} title="Thiết kế" onClick={() => router.push("/design")} />
            ) : null}
          </SettingsGroup>
        ) : null}

        {/* Wiping the data alone above signing out, so neither is hit for the other. */}
        <WipeDataGroup summary={dataSummary} />

        {/* Signing out last and alone, as in native settings. */}
        <SettingsGroup>
          <SignOutRow />
        </SettingsGroup>

        {/* The app itself at the foot, as an iOS app's About: its icon, its name, its version. */}
        <div className="flex flex-col items-center gap-2 pt-2 pb-4 text-muted-foreground">
          <TimiIcon size={48} className="size-12" />
          <TimiWordmark className="text-xl text-foreground" />
          <p className="text-xs">
            Phiên bản {process.env.NEXT_PUBLIC_APP_VERSION} · Beta
          </p>
        </div>
      </div>

      {/* Screens slide in like native navigation. */}
      <PageSheet
        title={sheetScreen ? screens[sheetScreen].title : null}
        open={sheetScreen !== null}
        onOpenChange={(next) => {
          if (next) return
          setSheetScreen(null)
          forgetScreenParam()
        }}
      >
        {sheetScreen ? renderScreen(sheetScreen) : null}
      </PageSheet>

      <PlanOverlay
        open={planOpen}
        onOpenChange={(next) => {
          setPlanOpen(next)
          if (!next) forgetScreenParam()
        }}
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={paymentOutcome}
      />

      {/* The limits known, so deleting a group with one says it goes too. */}
      <BudgetProvider overview={budgets}>
        <CategoryManagementSheet
          groups={categoryGroups}
          open={categoriesOpen}
          onOpenChange={setCategoriesOpen}
        />
      </BudgetProvider>
      <BudgetsSheet overview={budgets} open={budgetsOpen} onOpenChange={setBudgetsOpen} />
    </>
  )
}
