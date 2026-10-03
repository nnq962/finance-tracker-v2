"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { firebaseApp } from "@/lib/firebase/client"

/** Through the messaging service worker, which can show one while the app is open. */
async function showSystemNotification(title: string, body?: string) {
  const registration = await navigator.serviceWorker.getRegistration("/firebase-cloud-messaging-push-scope")
  if (!registration) throw new Error("No messaging service worker")
  await registration.showNotification(title, { body, tag: "welcome", icon: "/icons/pwa-192.png" })
}

export function PushMessageListener() {
  const router = useRouter()
  useEffect(() => {
    let disposed = false
    let unsubscribe: (() => void) | undefined
    void import("firebase/messaging").then(async ({ getMessaging, isSupported, onMessage }) => {
      if (!(await isSupported()) || disposed) return
      unsubscribe = onMessage(getMessaging(firebaseApp), (payload) => {
        const title = payload.notification?.title ?? "Finance Tracker"
        // The welcome proves notifications reach the device, and it always
        // arrives with the app open (it is sent as notifications are turned
        // on), so it shows as a system notification rather than a toast.
        if (payload.data?.type === "welcome") {
          void showSystemNotification(title, payload.notification?.body).catch(() => {
            toast(title, { description: payload.notification?.body })
          })
          return
        }
        toast(title, {
          description: payload.notification?.body,
          // Daily reminders ask to log spending, so offer the Transactions page.
          action: payload.data?.type === "daily-reminder" ? {
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
