"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SessionUser } from "@/lib/auth/session"
import { signOutCurrentUser } from "@/lib/firebase/auth"

type AccountSettingsProps = {
  user: SessionUser
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter()
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
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin tài khoản</CardTitle>
        <CardDescription>
          Thông tin đăng nhập đang được sử dụng trên Finance Tracker.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">Đang hoạt động</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-w-0 items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {user.email || "Chưa cập nhật email"}
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          type="button"
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
        >
          <LogOutIcon />
          {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </Button>
      </CardFooter>
    </Card>
  )
}
