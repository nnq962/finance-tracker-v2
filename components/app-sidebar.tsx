"use client"

import * as React from "react"

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
} from "@/components/animate-ui/components/radix/sidebar"
import {
  ArrowLeftRightIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  TagsIcon,
  TerminalIcon,
  WalletCardsIcon,
} from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <TerminalIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Finance Tracker</span>
                  <span className="truncate text-xs">Personal Finance</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
