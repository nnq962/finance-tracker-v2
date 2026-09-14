"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeftRightIcon,
  GalleryVerticalEndIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  TagsIcon,
  WalletCardsIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { SessionUser } from "@/lib/auth/session"

const navMain = [
  {
    title: "Tổng quan",
    url: "/overview",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Giao dịch",
    url: "/transactions",
    icon: <ArrowLeftRightIcon />,
  },
  {
    title: "Tài khoản",
    url: "/accounts",
    icon: <WalletCardsIcon />,
  },
  {
    title: "Hạng mục",
    url: "/categories",
    icon: <TagsIcon />,
  },
  {
    title: "Nợ & Cho vay",
    url: "/debts",
    icon: <HandCoinsIcon />,
  },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SessionUser }) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/overview" prefetch>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Finance Tracker</span>
                  <span className="truncate text-xs">Personal Finance</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
