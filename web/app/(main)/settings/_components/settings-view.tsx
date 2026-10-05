"use client"

import * as React from "react"
import {
  BadgeCheckIcon,
  BellRingIcon,
  CalculatorIcon,
  CircleHelpIcon,
  MicIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  TagsIcon,
} from "lucide-react"

import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { PlanOverlay } from "@/components/plans/plan-overlay"
import { useWelcome } from "@/components/onboarding/welcome"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import type { SessionUser } from "@/lib/auth/session"
import type { CategoryGroup } from "@/lib/categories/types"
import type { NotificationState } from "@/lib/notifications/types"
import type { AdminData } from "@/lib/plans/admin-data"
import type { PaymentOutcome } from "@/lib/plans/payos"
import { plans, type PlanState } from "@/lib/plans/plans"

import { AdminScreen } from "./admin-screen"
import { AiQuotaGroup } from "./ai-quota-group"
import { InstallAppRow } from "./install-app-row"
import { NotificationDevices } from "./notification-devices"
import { NotificationPreferences } from "./notification-preferences"
import { SalaryCalculator } from "./salary-calculator"
import { SignOutRow } from "./sign-out-row"
import { ThemeOptions, themeOptions, useThemeChoice } from "./theme-options"
import { VoiceLab } from "./voice-lab"

/** Screens opened from the list, in a sheet that slides in from the side. */
const screens = {
  admin: {
    title: "Quản trị",
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
  voice: {
    title: "Thử giọng nói",
  },
  salary: {
    title: "Tính lương",
  },
} as const

export type Screen = keyof typeof screens

type SettingsViewProps = {
  user: SessionUser
  notifications: NotificationState
  categoryGroups: CategoryGroup[]
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /** Only for admins: every user and the month's takings. */
  adminData?: AdminData
  /** Opens this screen straight away, e.g. from the missions on the overview, or the plans back from payOS. */
  initialScreen?: Screen | "plan"
}

export function SettingsView({
  user,
  notifications,
  categoryGroups,
  planState,
  checkoutEnabled,
  paymentOutcome,
  adminData,
  initialScreen,
}: SettingsViewProps) {
  const [sheetScreen, setSheetScreen] = React.useState<Screen | null>(
    initialScreen && initialScreen !== "plan" ? initialScreen : null,
  )
  const [planOpen, setPlanOpen] = React.useState(initialScreen === "plan")
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  // Summaries on the list follow changes made in the screens.
  const [reminder, setReminder] = React.useState(notifications.settings)
  const [devices, setDevices] = React.useState(notifications)
  const { choice } = useThemeChoice()
  const { openWelcome } = useWelcome()

  const open = (screen: Screen) => setSheetScreen(screen)
  const isPro = planState.plan === "pro"

  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case "admin":
        return adminData ? <AdminScreen data={adminData} /> : null
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
    }
  }

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
      {/* From md up the groups pair up across the full width, the app
          group last. */}
      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-x-8">
        <SettingsGroup title="Tài khoản">
          <SettingsRow
            media={
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            }
            title={
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate">{user.name}</span>
                {isPro ? (
                  <BadgeCheckIcon className="size-4 shrink-0 text-ai" role="img" aria-label="Pro" />
                ) : null}
              </span>
            }
            description={user.email || undefined}
            value={<Badge variant={isPro ? "secondary" : "outline"}>{plans[planState.plan].label}</Badge>}
            onClick={() => setPlanOpen(true)}
          />
          <SignOutRow />
        </SettingsGroup>

        <AiQuotaGroup planState={planState} />

        {adminData ? (
          <SettingsGroup title="Quản trị">
            <SettingsRow
              icon={ShieldCheckIcon}
              title="Người dùng & gói"
              value={String(adminData.users.length)}
              onClick={() => open("admin")}
            />
            {/* A tool for checking speech recognition on a device, not for users. */}
            <SettingsRow
              icon={MicIcon}
              title="Thử giọng nói"
              onClick={() => open("voice")}
            />
          </SettingsGroup>
        ) : null}

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
        </SettingsGroup>

        <SettingsGroup title="Thông báo">
          <SettingsRow
            icon={BellRingIcon}
            title="Nhắc ghi chi tiêu"
            value={reminder.notificationsEnabled ? `Bật · ${reminder.dailyReminderTime}` : "Tắt"}
            onClick={() => open("notifications")}
          />
          <SettingsRow
            icon={SmartphoneIcon}
            title="Thiết bị nhận thông báo"
            value={String(devices.devices.length)}
            onClick={() => open("devices")}
          />
        </SettingsGroup>

        <SettingsGroup
          title="Ứng dụng"
          footer={
            <span className="flex items-center justify-center gap-2">
              Finance Tracker · v{process.env.NEXT_PUBLIC_APP_VERSION}
              <Badge variant="secondary">Beta</Badge>
            </span>
          }
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
      </div>

      {/* Screens slide in like native navigation. */}
      <Sheet open={sheetScreen !== null} onOpenChange={(next) => !next && setSheetScreen(null)}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {sheetScreen ? (
            <>
              <SheetNavHeader
                backLabel="Cài đặt"
                title={screens[sheetScreen].title}
              />
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
                {renderScreen(sheetScreen)}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <PlanOverlay
        open={planOpen}
        onOpenChange={setPlanOpen}
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={paymentOutcome}
        backLabel="Cài đặt"
      />

      <CategoryManagementSheet
        groups={categoryGroups}
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </>
  )
}
