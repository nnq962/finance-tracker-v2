"use client"

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { toast } from "sonner"
import { NotificationDialogContent } from "@/components/user-menu/notification-dialog-content"
import { Separator } from "@/components/ui/separator"
import { saveNotificationSettingsAction } from "@/lib/notifications/actions"
import type { NotificationSettings } from "@/lib/notifications/types"
import { PUSH_DEVICE_CHANGED, notifyPushDeviceChanged, registerAccountPushDevice } from "@/lib/firebase/push-device"
import { pushTestError } from "@/lib/firebase/messaging"

function notificationPermission() {
  return "Notification" in window ? Notification.permission : "unsupported"
}

function subscribePermission(onChange: () => void) {
  window.addEventListener("focus", onChange)
  window.addEventListener(PUSH_DEVICE_CHANGED, onChange)
  document.addEventListener("visibilitychange", onChange)
  return () => {
    window.removeEventListener("focus", onChange)
    window.removeEventListener(PUSH_DEVICE_CHANGED, onChange)
    document.removeEventListener("visibilitychange", onChange)
  }
}

export function NotificationPreferences({ uid, initialSettings, children }: { uid: string; initialSettings: NotificationSettings; children?: ReactNode }) {
  const [draft, setDraft] = useState({ ...initialSettings, timeZone: "Asia/Ho_Chi_Minh" })
  const saved = useRef(initialSettings)
  const pending = useRef(false)
  const [saving, setSaving] = useState(false)
  const permission = useSyncExternalStore(subscribePermission, notificationPermission, () => null)
  const checked = draft.notificationsEnabled && permission === "granted"

  async function persist(settings: NotificationSettings) {
    const result = await saveNotificationSettingsAction({ ...settings, timeZone: "Asia/Ho_Chi_Minh" }, uid)
    if (!result.success) throw new Error(result.error)
    saved.current = result.data
    setDraft(result.data)
    notifyPushDeviceChanged()
  }

  async function toggleNotifications(enabled: boolean) {
    if (pending.current) return
    pending.current = true
    setSaving(true)
    const toastId = toast.loading(enabled ? "Đang kết nối thiết bị…" : "Đang tắt thông báo…")
    try {
      if (enabled) {
        // Permission must be requested directly from the switch gesture on iOS.
        await registerAccountPushDevice(uid)
        if (notificationPermission() !== "granted") throw new Error("Bạn chưa cho phép thông báo.")
      } else {
        setDraft((current) => ({ ...current, notificationsEnabled: false }))
      }
      await persist({ ...draft, notificationsEnabled: enabled })
      toast.success(enabled ? "Đã bật thông báo." : "Đã tắt thông báo.", { id: toastId })
    } catch (error) {
      setDraft(saved.current)
      toast.error(pushTestError(error), { id: toastId })
    } finally {
      pending.current = false
      setSaving(false)
      notifyPushDeviceChanged()
    }
  }

  async function saveReminderTime(value: string) {
    if (pending.current || value === saved.current.dailyReminderTime) return
    pending.current = true
    setSaving(true)
    const toastId = toast.loading("Đang lưu giờ nhắc…")
    try {
      await persist({ ...draft, dailyReminderTime: value })
      toast.success("Đã lưu giờ nhắc.", { id: toastId })
    } catch (error) {
      setDraft(saved.current)
      toast.error(pushTestError(error), { id: toastId })
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return (
    <div>
      <NotificationDialogContent
        settings={draft}
        onSettingsChange={setDraft}
        notificationsEnabled={checked}
        onNotificationsEnabledChange={(enabled) => void toggleNotifications(enabled)}
        onReminderTimeCommit={(value) => void saveReminderTime(value)}
        disabled={saving || permission === null}
      >
        {children && <>
          <Separator />
          {children}
        </>}
      </NotificationDialogContent>
    </div>
  )
}
