"use client"

import { useEffect, useState } from "react"

import { BellOffIcon, BellRingIcon, MonitorIcon, SmartphoneIcon } from "lucide-react"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Badge } from "@/components/ui/badge"
import { pushErrorMessage } from "@/lib/firebase/messaging"
import { PUSH_DEVICE_CHANGED } from "@/lib/firebase/push-device"
import { formatDate, toDateKey } from "@/lib/format-date"
import { getNotificationStateAction } from "@/lib/notifications/actions"
import type { NotificationState } from "@/lib/notifications/types"

function formatUpdatedAt(value: string) {
  return formatDate(toDateKey(value))
}

export function NotificationDevices({ uid, initialState, onChange, onOpenReminders }: {
  uid: string
  initialState: NotificationState
  /** Reports the latest device list, e.g. for a summary elsewhere. */
  onChange?: (state: NotificationState) => void
  /** Opens Nhắc ghi chi tiêu, where this device is turned on. */
  onOpenReminders?: () => void
}) {
  const [deviceState, setDeviceState] = useState(initialState)
  const [deviceId, setDeviceId] = useState(initialState.currentDeviceId)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null)
  // A list that could not be refreshed says so under itself (2026-10-21), not in a toast on
  // opening the screen and again on every return to the app; the last list it had stays.
  const [loadError, setLoadError] = useState<string | null>(null)

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
          setLoadError(null)
        }
      } catch (error) {
        if (active && id === requestId) setLoadError(pushErrorMessage(error))
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

  // This device could still take notifications: a way to turn them on, rather than only saying where.
  const canTurnOn = Boolean(onOpenReminders) && (permission === "default" || (permission === "granted" && !deviceId))

  return (
    <div className="flex flex-col gap-6">
      <SettingsGroup footer={loadError ? `Chưa tải lại được danh sách: ${loadError}` : status}>
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
      {canTurnOn ? (
        <SettingsGroup>
          <SettingsRow icon={BellRingIcon} title="Bật trên thiết bị này" description="Trong Nhắc ghi chi tiêu" onClick={onOpenReminders} />
        </SettingsGroup>
      ) : null}
    </div>
  )
}
