"use client"

import * as React from "react"
import { toast } from "sonner"

import { SettingsRow } from "@/components/settings-list"
import { signOutCurrentUser } from "@/lib/firebase/auth"

export function SignOutRow() {
  const [isSigningOut, setIsSigningOut] = React.useState(false)

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
    <SettingsRow
      destructive
      title={isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
      disabled={isSigningOut}
      onClick={() => void handleSignOut()}
    />
  )
}
