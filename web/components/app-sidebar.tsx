"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { SettingsIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { appNavigationItems } from "@/lib/app-navigation"

const navMain = [
  ...appNavigationItems.map(({ title, url, icon: Icon }) => ({
    title,
    url,
    icon: <Icon />,
  })),
  {
    title: "Cài đặt",
    url: "/settings",
    icon: <SettingsIcon />,
  },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/overview"
                prefetch={false}
                onNavigate={() => {
                  if (isMobile) setOpenMobile(false)
                }}
              >
                <Image src="/icon.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {/* Beta as part of the name, as beta builds of apps are
                      named: a pill beside it left the name no room in the
                      16rem sidebar and cut it to "Finance Track…". */}
                  <span className="truncate font-medium">
                    Finance Tracker <span className="font-normal text-muted-foreground">Beta</span>
                  </span>
                  <span className="truncate text-xs">
                    Tài chính cá nhân · v{process.env.NEXT_PUBLIC_APP_VERSION}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
