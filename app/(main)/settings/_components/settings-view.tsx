"use client"

import * as React from "react"
import {
  BellRingIcon,
  PaletteIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react"

import {
  defaultNotificationSettings,
  NotificationDialogContent,
  type NotificationSettings,
} from "@/components/user-menu/notification-dialog-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SessionUser } from "@/lib/auth/session"

import { AccountSettings } from "./account-settings"
import { AppearanceSettings } from "./appearance-settings"

const settingsSections = [
  {
    value: "account",
    label: "Tài khoản",
    icon: UserRoundIcon,
  },
  {
    value: "appearance",
    label: "Giao diện",
    icon: PaletteIcon,
  },
  {
    value: "notifications",
    label: "Thông báo",
    icon: BellRingIcon,
  },
] as const satisfies ReadonlyArray<{
  value: string
  label: string
  icon: LucideIcon
}>

type SettingsSection = (typeof settingsSections)[number]["value"]

type SettingsViewProps = {
  user: SessionUser
}

export function SettingsView({ user }: SettingsViewProps) {
  const [activeSection, setActiveSection] =
    React.useState<SettingsSection>("account")
  const [notificationSettings, setNotificationSettings] =
    React.useState<NotificationSettings>(defaultNotificationSettings)

  const notificationContent = (
    <NotificationDialogContent
      settings={notificationSettings}
      onSettingsChange={setNotificationSettings}
    />
  )

  return (
    <div className="grid items-start gap-6 md:grid-cols-[14rem_minmax(0,1fr)]">
      <Card size="sm" className="sticky top-20 hidden md:flex">
        <CardContent>
          <nav className="space-y-1" aria-label="Danh mục cài đặt">
            {settingsSections.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                type="button"
                variant={activeSection === value ? "outline" : "ghost"}
                className="w-full justify-start"
                aria-current={activeSection === value ? "page" : undefined}
                onClick={() => setActiveSection(value)}
              >
                <Icon />
                {label}
              </Button>
            ))}
          </nav>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6 md:space-y-0">
        <section
          aria-label="Tài khoản"
          className={cn(activeSection !== "account" && "md:hidden")}
        >
          <AccountSettings user={user} />
        </section>
        <section
          aria-label="Giao diện"
          className={cn(activeSection !== "appearance" && "md:hidden")}
        >
          <AppearanceSettings />
        </section>
        <section
          aria-label="Thông báo"
          className={cn(activeSection !== "notifications" && "md:hidden")}
        >
          {notificationContent}
        </section>
      </div>
    </div>
  )
}
