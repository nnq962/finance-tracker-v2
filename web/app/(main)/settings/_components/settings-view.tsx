"use client"

import * as React from "react"
import {
  BellRingIcon,
  ChevronLeftIcon,
  PaletteIcon,
  SmartphoneIcon,
  TagsIcon,
} from "lucide-react"

import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import type { SessionUser } from "@/lib/auth/session"
import type { CategoryGroup } from "@/lib/categories/types"
import type { NotificationState } from "@/lib/notifications/types"

import { InstallAppRow } from "./install-app-row"
import { NotificationDevices } from "./notification-devices"
import { NotificationPreferences } from "./notification-preferences"
import { SignOutRow } from "./sign-out-row"
import { ThemeOptions, themeOptions, useThemeChoice } from "./theme-options"

/** Screens opened from the list: a sliding sheet on mobile, a side panel from md. */
const screens = {
  appearance: {
    title: "Giao diện",
    description: "Chọn giao diện sáng, tối hoặc theo thiết bị.",
  },
  notifications: {
    title: "Nhắc ghi chi tiêu",
    description: "Một lời nhắc mỗi ngày để bạn không quên ghi lại chi tiêu.",
  },
  devices: {
    title: "Thiết bị nhận thông báo",
    description: "Các thiết bị đang nhận lời nhắc của tài khoản này.",
  },
} as const

type Screen = keyof typeof screens

type SettingsViewProps = {
  user: SessionUser
  notifications: NotificationState
  categoryGroups: CategoryGroup[]
}

export function SettingsView({ user, notifications, categoryGroups }: SettingsViewProps) {
  const isMobile = useIsMobile()
  const [sheetScreen, setSheetScreen] = React.useState<Screen | null>(null)
  const [panelScreen, setPanelScreen] = React.useState<Screen>("appearance")
  const [categoriesOpen, setCategoriesOpen] = React.useState(false)
  // Summaries on the list follow changes made in the screens.
  const [reminder, setReminder] = React.useState(notifications.settings)
  const [devices, setDevices] = React.useState(notifications)
  const { choice } = useThemeChoice()

  const open = (screen: Screen) => {
    if (isMobile) setSheetScreen(screen)
    else setPanelScreen(screen)
  }

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
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-8">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardContent className="flex min-w-0 items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-heading text-base font-extrabold">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {user.email || "Chưa cập nhật email"}
              </p>
            </div>
          </CardContent>
        </Card>

        <SettingsGroup title="Chung">
          <SettingsRow
            icon={PaletteIcon}
            color="violet"
            title="Giao diện"
            value={themeOptions.find((option) => option.value === choice)?.label}
            active={panelScreen === "appearance"}
            onClick={() => open("appearance")}
          />
          <SettingsRow
            icon={TagsIcon}
            color="orange"
            title="Hạng mục"
            value={`${categoryCount} mục`}
            onClick={() => setCategoriesOpen(true)}
          />
          <SettingsRow
            icon={BellRingIcon}
            color="amber"
            title="Nhắc ghi chi tiêu"
            value={reminder.notificationsEnabled ? `Bật · ${reminder.dailyReminderTime}` : "Tắt"}
            active={panelScreen === "notifications"}
            onClick={() => open("notifications")}
          />
        </SettingsGroup>

        <SettingsGroup title="Thiết bị">
          <SettingsRow
            icon={SmartphoneIcon}
            color="blue"
            title="Thiết bị nhận thông báo"
            value={String(devices.devices.length)}
            active={panelScreen === "devices"}
            onClick={() => open("devices")}
          />
          <InstallAppRow />
        </SettingsGroup>

        <SignOutRow />

        <p className="text-center text-xs text-muted-foreground">
          Finance Tracker · v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </div>

      {/* md and up: the chosen screen next to the list. */}
      {!isMobile ? (
        <section aria-labelledby="settings-panel-title" className="hidden min-w-0 space-y-4 md:block">
          <div className="space-y-1">
            <h2 id="settings-panel-title" className="font-heading text-lg font-extrabold">
              {screens[panelScreen].title}
            </h2>
            <p className="text-sm text-muted-foreground">{screens[panelScreen].description}</p>
          </div>
          {renderScreen(panelScreen)}
        </section>
      ) : null}

      {/* Mobile: screens slide in like native navigation. */}
      <Sheet open={sheetScreen !== null} onOpenChange={(next) => !next && setSheetScreen(null)}>
        <SheetContent
          showCloseButton={false}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {sheetScreen ? (
            <>
              <SheetHeader>
                <SheetClose asChild>
                  <Button type="button" variant="ghost" size="sm" className="-ml-2 self-start">
                    <ChevronLeftIcon />
                    Cài đặt
                  </Button>
                </SheetClose>
                <SheetTitle>{screens[sheetScreen].title}</SheetTitle>
                <SheetDescription>{screens[sheetScreen].description}</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
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
    </div>
  )
}
