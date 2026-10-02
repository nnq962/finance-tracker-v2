"use client"

import * as React from "react"
import {
  BellRingIcon,
  PaletteIcon,
  TagsIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react"

import type { CategoryGroup } from "@/lib/categories/types"
import type { NotificationState } from "@/lib/notifications/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { SessionUser } from "@/lib/auth/session"

import { AccountSettings } from "./account-settings"
import { AppearanceSettings } from "./appearance-settings"
import { CategorySettings } from "./category-settings"
import { NotificationDevices } from "./notification-devices"
import { NotificationPreferences } from "./notification-preferences"

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
    value: "categories",
    label: "Hạng mục",
    icon: TagsIcon,
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
  notifications: NotificationState
  categoryGroups: CategoryGroup[]
}

export function SettingsView({ user, notifications, categoryGroups }: SettingsViewProps) {
  const [activeSection, setActiveSection] =
    React.useState<SettingsSection>("account")

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
          aria-label="Hạng mục"
          className={cn(activeSection !== "categories" && "md:hidden")}
        >
          <CategorySettings groups={categoryGroups} />
        </section>
        <section
          aria-label="Thông báo"
          className={cn("space-y-6", activeSection !== "notifications" && "md:hidden")}
        >
          <NotificationPreferences uid={user.uid} initialSettings={notifications.settings}>
            <NotificationDevices uid={user.uid} initialState={notifications} />
          </NotificationPreferences>
        </section>
      </div>
    </div>
  )
}
