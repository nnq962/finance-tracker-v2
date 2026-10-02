"use client"

import * as React from "react"
import {
  BellRingIcon,
  CalculatorIcon,
  CircleHelpIcon,
  MicIcon,
  PaletteIcon,
  SmartphoneIcon,
  TagsIcon,
} from "lucide-react"

import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { useWelcome } from "@/components/onboarding/welcome"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import type { SessionUser } from "@/lib/auth/session"
import type { CategoryGroup } from "@/lib/categories/types"
import type { NotificationState } from "@/lib/notifications/types"

import { InstallAppRow } from "./install-app-row"
import { NotificationDevices } from "./notification-devices"
import { NotificationPreferences } from "./notification-preferences"
import { SalaryCalculator } from "./salary-calculator"
import { SignOutRow } from "./sign-out-row"
import { ThemeOptions, themeOptions, useThemeChoice } from "./theme-options"
import { VoiceLab } from "./voice-lab"

/** Screens opened from the list, in a sheet that slides in from the side. */
const screens = {
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
  /** Opens this screen straight away, e.g. from the getting-started checklist. */
  initialScreen?: Screen
}

export function SettingsView({ user, notifications, categoryGroups, initialScreen }: SettingsViewProps) {
  const [sheetScreen, setSheetScreen] = React.useState<Screen | null>(initialScreen ?? null)
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  // Summaries on the list follow changes made in the screens.
  const [reminder, setReminder] = React.useState(notifications.settings)
  const [devices, setDevices] = React.useState(notifications)
  const { choice } = useThemeChoice()
  const { openWelcome } = useWelcome()

  const open = (screen: Screen) => setSheetScreen(screen)

  const renderScreen = (screen: Screen) => {
    switch (screen) {
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
            title={user.name}
            description={user.email || "Chưa cập nhật email"}
          />
          <SignOutRow />
        </SettingsGroup>

        <SettingsGroup title="Chung">
          <SettingsRow
            icon={PaletteIcon}
            color="violet"
            title="Giao diện"
            value={themeOptions.find((option) => option.value === choice)?.label}
            onClick={() => open("appearance")}
          />
          <SettingsRow
            icon={TagsIcon}
            color="orange"
            title="Hạng mục"
            value={`${categoryCount} mục`}
            onClick={() => setCategoriesOpen(true)}
          />
        </SettingsGroup>

        <SettingsGroup title="Thông báo">
          <SettingsRow
            icon={BellRingIcon}
            color="amber"
            title="Nhắc ghi chi tiêu"
            value={reminder.notificationsEnabled ? `Bật · ${reminder.dailyReminderTime}` : "Tắt"}
            onClick={() => open("notifications")}
          />
          <SettingsRow
            icon={SmartphoneIcon}
            color="blue"
            title="Thiết bị nhận thông báo"
            value={String(devices.devices.length)}
            onClick={() => open("devices")}
          />
        </SettingsGroup>

        <SettingsGroup title="Tiện ích">
          <SettingsRow
            icon={CalculatorIcon}
            color="emerald"
            title="Tính lương"
            description="Lương thực nhận, bảo hiểm, thuế TNCN, tăng ca"
            onClick={() => open("salary")}
          />
        </SettingsGroup>

        <SettingsGroup title="Thử nghiệm">
          <SettingsRow
            icon={MicIcon}
            color="rose"
            title="Thử giọng nói"
            onClick={() => open("voice")}
          />
        </SettingsGroup>

        <SettingsGroup
          title="Ứng dụng"
          footer={`Finance Tracker · v${process.env.NEXT_PUBLIC_APP_VERSION}`}
        >
          <SettingsRow
            icon={CircleHelpIcon}
            color="cyan"
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

      <CategoryManagementSheet
        groups={categoryGroups}
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </>
  )
}
