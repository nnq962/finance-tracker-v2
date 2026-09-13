"use client"

import * as React from "react"
import { onIdTokenChanged } from "firebase/auth"
import { usePathname, useRouter } from "next/navigation"

import { clearServerSession, syncServerSession } from "@/lib/firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"

export function AuthSessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    let active = true

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      if (!active) {
        return
      }

      if (!user) {
        await clearServerSession().catch(() => undefined)

        if (active) {
          const next = encodeURIComponent(pathname)
          router.replace(`/login?next=${next}`)
          router.refresh()
        }
        return
      }

      try {
        await syncServerSession(user)
      } catch {
        await clearServerSession().catch(() => undefined)

        if (active) {
          const next = encodeURIComponent(pathname)
          router.replace(`/login?next=${next}`)
          router.refresh()
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [pathname, router])

  return children
}
