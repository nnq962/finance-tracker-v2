"use client"

import * as React from "react"
import { toast } from "sonner"
import { pushTestError } from "@/lib/firebase/messaging"
import { onIdTokenChanged } from "firebase/auth"
import { usePathname, useRouter } from "next/navigation"

import { clearServerSession, syncServerSession } from "@/lib/firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { stopPushDeviceSync, syncAccountPushDevice } from "@/lib/firebase/push-device"

export function AuthSessionGuard({ children, initialUid }: { children: React.ReactNode; initialUid: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const pathnameRef = React.useRef(pathname)

  React.useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  React.useEffect(() => {
    let active = true

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      if (!active) {
        return
      }

      if (!user) {
        await clearServerSession(null).catch(() => undefined)

        if (active && !firebaseAuth.currentUser) {
          const next = encodeURIComponent(pathnameRef.current)
          router.replace(`/login?next=${next}`)
          router.refresh()
        }
        return
      }

      try {
        await syncServerSession(user)
        if (active && firebaseAuth.currentUser?.uid === user.uid) {
          if (user.uid !== initialUid) router.refresh()
          void syncAccountPushDevice(user.uid).catch((error) => {
            if (active && firebaseAuth.currentUser?.uid === user.uid) {
              toast.error(pushTestError(error), { id: "push-device-sync" })
            }
          })
        }
      } catch {
        if (!active || firebaseAuth.currentUser?.uid !== user.uid) return
        await clearServerSession(user.uid).catch(() => undefined)

        if (active && firebaseAuth.currentUser?.uid === user.uid) {
          const next = encodeURIComponent(pathnameRef.current)
          router.replace(`/login?next=${next}`)
          router.refresh()
        }
      }
    })

    const refreshDevice = () => {
      const uid = firebaseAuth.currentUser?.uid
      if (uid && active) void syncAccountPushDevice(uid).catch((error) => {
        if (active && firebaseAuth.currentUser?.uid === uid) toast.error(pushTestError(error), { id: "push-device-sync" })
      })
    }
    window.addEventListener("focus", refreshDevice)

    return () => {
      active = false
      unsubscribe()
      stopPushDeviceSync()
      window.removeEventListener("focus", refreshDevice)
    }
  }, [router, initialUid])

  return children
}
