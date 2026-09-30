"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { firebaseApp } from "@/lib/firebase/client"

export function PushMessageListener() {
  const router = useRouter()
  useEffect(() => {
    let disposed = false
    let unsubscribe: (() => void) | undefined
    void import("firebase/messaging").then(async ({ getMessaging, isSupported, onMessage }) => {
      if (!(await isSupported()) || disposed) return
      unsubscribe = onMessage(getMessaging(firebaseApp), (payload) => {
        toast(payload.notification?.title ?? "Finance Tracker", {
          description: payload.notification?.body,
          action: payload.data?.type === "push-test" ? {
            label: "Mở giao dịch",
            onClick: () => { router.push("/transactions") },
          } : undefined,
        })
      })
    }).catch(() => { /* Unsupported environments must not interrupt the app. */ })
    return () => { disposed = true; unsubscribe?.() }
  }, [router])
  return null
}
