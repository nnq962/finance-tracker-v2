"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { pushTestError } from "@/lib/firebase/messaging"
import { PUSH_DEVICE_CHANGED } from "@/lib/firebase/push-device"
import { getNotificationStateAction } from "@/lib/notifications/actions"
import type { NotificationState } from "@/lib/notifications/types"

import { toast } from "sonner"

export function NotificationDevices({ uid, initialState }: { uid: string; initialState: NotificationState }) {
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
        if (active && id === requestId) toast.error(pushTestError(error), { id: "notification-devices" })
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

  const permissionLabel = permission === null ? "Đang kiểm tra quyền"
    : permission === "granted" ? "Đã cấp quyền"
      : permission === "denied" ? "Đã chặn thông báo"
        : permission === "unsupported" ? "Chưa hỗ trợ" : "Chưa cấp quyền"

  return (
    <FieldGroup>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel asChild><h3>Thiết bị ({deviceState.devices.length})</h3></FieldLabel>
        <Badge variant={permission === "denied" ? "destructive" : permission === "granted" && deviceId ? "secondary" : "outline"}>
          {permission === "granted" ? deviceId ? "Đã kết nối" : "Chưa kết nối" : permissionLabel}
        </Badge>
      </div>
      {deviceState.devices.length > 0 && (
        <ul className="space-y-2" aria-label="Thiết bị nhận thông báo">
          {deviceState.devices.map((device) => (
            <li key={device.id}>
              <FieldDescription>
                {device.name}{device.id === deviceId ? " · Thiết bị này" : ""}
              </FieldDescription>
            </li>
          ))}
        </ul>
      )}
    </FieldGroup>
  )
}
