"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BadgeCheckIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOutCurrentUser } from "@/lib/firebase/auth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)

    try {
      await signOutCurrentUser()
      // Full navigation: nothing of this account stays in the client cache or
      // in the back/forward cache.
      window.location.replace("/login")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đăng xuất. Vui lòng thử lại.")
      setIsSigningOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="truncate font-medium">{user.name}</span>
                  <BadgeCheckIcon className="size-4 shrink-0 fill-blue-500 text-white" role="img" aria-label="Đã đăng nhập" />
                </div>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal text-foreground">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate font-medium">{user.name}</span>
                    <BadgeCheckIcon className="size-4 shrink-0 fill-blue-500 text-white" role="img" aria-label="Đã đăng nhập" />
                  </div>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSigningOut}
              onSelect={() => void handleSignOut()}
            >
              <LogOutIcon />
              {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
