"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  LogOutIcon,
  SparklesIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import {
  defaultNotificationSettings,
  type NotificationSettings,
} from "@/components/user-menu/notification-dialog-content"
import {
  UserMenuDialog,
  type UserMenuDialogType,
} from "@/components/user-menu/user-menu-dialog"
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
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [displayName, setDisplayName] = React.useState(user.name)
  const [activeDialog, setActiveDialog] =
    React.useState<UserMenuDialogType>(null)
  const [notificationSettings, setNotificationSettings] =
    React.useState<NotificationSettings>(defaultNotificationSettings)
  const initials = displayName
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
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate font-medium">{displayName}</span>
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
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={displayName} />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate font-medium">{displayName}</span>
                      <BadgeCheckIcon className="size-4 shrink-0 fill-blue-500 text-white" role="img" aria-label="Đã đăng nhập" />
                    </div>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setActiveDialog("upgrade")}>
                  <SparklesIcon />
                  Nâng cấp lên Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setActiveDialog("account")}>
                  <BadgeCheckIcon />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveDialog("billing")}>
                  <CreditCardIcon />
                  Thanh toán
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setActiveDialog("notifications")}
                >
                  <BellIcon />
                  Thông báo
                </DropdownMenuItem>
              </DropdownMenuGroup>
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
      <UserMenuDialog
        activeDialog={activeDialog}
        onActiveDialogChange={setActiveDialog}
        name={displayName}
        onNameChange={setDisplayName}
        notificationSettings={notificationSettings}
        onNotificationSettingsChange={setNotificationSettings}
      />
    </>
  )
}
