"use client"

import { useEffect, useState } from "react"

import { BellOffIcon, MonitorIcon, SmartphoneIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { pushErrorMessage } from "@/lib/firebase/messaging"
import { PUSH_DEVICE_CHANGED } from "@/lib/firebase/push-device"
import { formatDate, toDateKey } from "@/lib/format-date"
import { getNotificationStateAction } from "@/lib/notifications/actions"
import type { NotificationState } from "@/lib/notifications/types"

import { toast } from "sonner"

function formatUpdatedAt(value: string) {
  return formatDate(toDateKey(value))
}

export function NotificationDevices({ uid, initialState, onChange }: {
  uid: string
  initialState: NotificationState
  /** Reports the latest device list, e.g. for a summary elsewhere. */
  onChange?: (state: NotificationState) => void
}) {
  const [deviceState, setDeviceState] = useState(initialState)
  const [deviceId, setDeviceId] = useState(initialState.currentDeviceId)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null)

  useEffect(() => {
    let active = true
    let requestId = 0
    const refreshDevices = async () => {
      const id = ++requestId
      try {
        const result = await getNotificationStateAction(uid)
        if (!active || id !== requestId) return
        if (!result.success) throw new Error(result.error)
        if (result.success) {
          setDeviceState(result.data)
          setDeviceId(result.data.currentDeviceId)
        }
      } catch (error) {
        if (active && id === requestId) toast.error(pushErrorMessage(error), { id: "notification-devices" })
      }
    }
    const refreshPermission = () => {
      const next = "Notification" in window ? Notification.permission : "unsupported"
      setPermission(next)
      if (next !== "granted") setDeviceId(null)
      void refreshDevices()
    }
    refreshPermission()
    window.addEventListener("focus", refreshPermission)
    window.addEventListener(PUSH_DEVICE_CHANGED, refreshPermission)
    return () => {
      active = false
      window.removeEventListener("focus", refreshPermission)
      window.removeEventListener(PUSH_DEVICE_CHANGED, refreshPermission)
    }
  }, [uid])

  useEffect(() => {
    onChange?.(deviceState)
  }, [deviceState, onChange])

  const status = permission === null ? "Đang kiểm tra quyền thông báo…"
    : permission === "denied" ? "Thông báo đang bị chặn trong cài đặt của thiết bị."
      : permission === "unsupported" ? "Trình duyệt chưa hỗ trợ. Trên iPhone, hãy cài ứng dụng ra Màn hình chính."
        : permission === "granted" && deviceId ? "Thiết bị này đang nhận thông báo."
          : "Bật Nhắc ghi chi tiêu để nhận trên thiết bị này."

  return (
    <SettingsGroup footer={status}>
      {deviceState.devices.length === 0 ? (
        <SettingsRow
          icon={BellOffIcon}
          title="Chưa có thiết bị nào"
        />
      ) : deviceState.devices.map((device) => (
        <SettingsRow
          key={device.id}
          icon={/iphone|ipad|android|pwa/i.test(device.name) ? SmartphoneIcon : MonitorIcon}
          title={device.name}
          description={`Cập nhật ${formatUpdatedAt(device.updatedAt)}`}
          action={device.id === deviceId ? <Badge variant="secondary">Thiết bị này</Badge> : null}
        />
      ))}
    </SettingsGroup>
  )
}
