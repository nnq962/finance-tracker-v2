"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeftRightIcon,
  HandCoinsIcon,
  LayoutDashboardIcon,
  TagsIcon,
  WalletCardsIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Badge } from "@/components/ui/badge"
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
                <Image src="/icon.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">Finance Tracker</span>
                    <Badge variant="secondary">Beta</Badge>
                  </div>
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
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
