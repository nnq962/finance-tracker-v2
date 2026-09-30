"use client"

import { useEffect, useState } from "react"
import { BellRingIcon, SendIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldDescription, FieldError, FieldGroup } from "@/components/ui/field"
import { pushTestError, registerPushTestDevice } from "@/lib/firebase/messaging"

import { sendPushTestAction } from "../actions"

export function PushTestSettings() {
  const [fid, setFid] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null)
  const [busy, setBusy] = useState<"register" | "send" | "delayed" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Bấm Đăng ký thiết bị, cho phép thông báo, rồi gửi thử.")

  useEffect(() => {
    const refreshPermission = () => {
      const next = "Notification" in window ? Notification.permission : "unsupported"
      setPermission(next)
      if (next !== "granted") setFid(null)
    }
    refreshPermission()
    window.addEventListener("focus", refreshPermission)
    return () => window.removeEventListener("focus", refreshPermission)
  }, [])

  async function registerDevice() {
    setBusy("register")
    setError(null)
    setFid(null)
    setStatus("Đang xin quyền và đăng ký thiết bị…")
    try {
      const installationId = await registerPushTestDevice()
      setFid(installationId)
      setStatus("Thiết bị đã đăng ký. Bạn có thể gửi thông báo thử.")
    } catch (error) {
      setError(pushTestError(error))
      setStatus("Chưa đăng ký được thiết bị.")
    } finally {
      setPermission("Notification" in window ? Notification.permission : "unsupported")
      setBusy(null)
    }
  }

  async function sendTest(delayed: boolean) {
    if (!fid) return
    setBusy(delayed ? "delayed" : "send")
    setError(null)
    setStatus(delayed
      ? "Thông báo sẽ gửi sau 8 giây. Chuyển sang tab khác hoặc đưa app xuống nền; giữ trang này mở."
      : "Đang gửi thông báo qua Firebase…")
    try {
      const result = await sendPushTestAction(fid, delayed)
      if (!result.success) throw new Error(result.error)
      setStatus("FCM đã nhận yêu cầu gửi. Khi đang mở app, xem toast; khi app ở nền, xem thông báo hệ thống. Đây chưa phải xác nhận thiết bị đã nhận.")
    } catch (error) {
      setError(pushTestError(error))
      setStatus("Gửi thử chưa thành công.")
    } finally {
      setBusy(null)
    }
  }

  const permissionLabel = permission === null ? "Đang kiểm tra quyền"
    : permission === "granted" ? "Đã cấp quyền"
      : permission === "denied" ? "Đã chặn thông báo"
        : permission === "unsupported" ? "Chưa hỗ trợ" : "Chưa cấp quyền"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BellRingIcon />Kiểm tra thông báo đẩy</CardTitle>
        <CardDescription>Gửi thông báo thật tới thiết bị đang dùng để kiểm tra kết nối Firebase.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="flex flex-wrap gap-2">
            <Badge variant={permission === "granted" ? "default" : permission === "denied" ? "destructive" : "outline"}>{permissionLabel}</Badge>
            <Badge variant={fid ? "secondary" : "outline"}>{fid ? "Thiết bị đã đăng ký" : "Chưa đăng ký thiết bị"}</Badge>
          </div>
          <div role="status" aria-live="polite"><FieldDescription>{status}</FieldDescription></div>
          {error && <FieldError>{error}</FieldError>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={busy !== null} onClick={() => void registerDevice()}>
              {busy === "register" ? "Đang đăng ký…" : fid ? "Đăng ký lại" : "Đăng ký thiết bị"}
            </Button>
            <Button type="button" variant="outline" disabled={!fid || busy !== null} onClick={() => void sendTest(false)}>
              <SendIcon />{busy === "send" ? "Đang gửi…" : "Gửi thử ngay"}
            </Button>
            <Button type="button" variant="outline" disabled={!fid || busy !== null} onClick={() => void sendTest(true)}>
              {busy === "delayed" ? "Đang chờ gửi…" : "Gửi sau 8 giây"}
            </Button>
          </div>
          <FieldDescription>
            iPhone/iPad: thêm ứng dụng vào Màn hình chính, mở từ biểu tượng rồi đăng ký.
            Dùng HTTPS hoặc localhost; HTTP qua địa chỉ mạng nội bộ không hỗ trợ.
            Nếu FCM đã gửi nhưng chưa thấy thông báo, kiểm tra quyền thông báo của trình duyệt trong hệ điều hành và chế độ Không làm phiền.
          </FieldDescription>
          <FieldDescription>
            Phần này chỉ gửi thử khi bạn bấm nút. Sau khi tải lại trang, đăng ký thiết bị lại để tiếp tục test.
            Giờ nhắc hằng ngày bên dưới chưa được nối với lịch gửi tự động.
          </FieldDescription>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
