"use client"

import { firebaseApp } from "@/lib/firebase/client"

async function waitForActiveWorker(registration: ServiceWorkerRegistration) {
  if (registration.active) return
  const worker = registration.installing ?? registration.waiting
  if (!worker) throw new Error("Không tìm thấy service worker. Tải lại trang rồi thử lại.")
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener("statechange", checkState)
      reject(new Error("Service worker chưa khởi động. Kiểm tra kết nối tới gstatic.com rồi thử lại."))
    }, 20_000)
    function checkState() {
      if (worker!.state !== "activated" && worker!.state !== "redundant") return
      window.clearTimeout(timeout)
      worker!.removeEventListener("statechange", checkState)
      if (worker!.state === "activated") resolve()
      else reject(new Error("Service worker không khởi động được. Kiểm tra cấu hình Firebase và kết nối mạng."))
    }
    worker.addEventListener("statechange", checkState)
    checkState()
  })
}

export async function registerPushTestDevice() {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    throw new Error("Thiếu VAPID key. Thêm NEXT_PUBLIC_FIREBASE_VAPID_KEY rồi khởi động lại hoặc redeploy ứng dụng.")
  }
  if (!window.isSecureContext) {
    throw new Error("Thông báo cần HTTPS hoặc localhost. Địa chỉ HTTP trong mạng nội bộ không hỗ trợ.")
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Thiết bị chưa hỗ trợ thông báo. Với iPhone, hãy thêm app vào Màn hình chính rồi mở từ biểu tượng.")
  }

  // Request before any asynchronous SDK loading to preserve the user gesture on iOS.
  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Thông báo đã bị chặn. Cho phép thông báo trong cài đặt trình duyệt rồi thử lại."
      : "Bạn chưa cho phép thông báo. Bấm đăng ký và chọn Cho phép.")
  }

  const { getMessaging, isSupported, onRegistered, register } = await import("firebase/messaging")
  if (!(await isSupported())) throw new Error("Trình duyệt này chưa hỗ trợ Firebase Cloud Messaging.")
  const worker = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/firebase-cloud-messaging-push-scope",
    updateViaCache: "none",
  })
  await waitForActiveWorker(worker)
  const messaging = getMessaging(firebaseApp)

  return new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      unsubscribe()
      reject(new Error("Đăng ký quá thời gian chờ. Kiểm tra mạng và FCM Registration API rồi thử lại."))
    }, 30_000)
    const unsubscribe = onRegistered(messaging, (fid) => {
      window.clearTimeout(timeout)
      unsubscribe()
      resolve(fid)
    })
    register(messaging, { vapidKey, serviceWorkerRegistration: worker }).catch((error: unknown) => {
      window.clearTimeout(timeout)
      unsubscribe()
      reject(error)
    })
  })
}

export function pushTestError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code) : ""
  if (code.includes("failed-service-worker-registration")) {
    return "Không thể khởi động service worker. Kiểm tra /firebase-messaging-sw.js và kết nối tới gstatic.com."
  }
  if (code.includes("subscribe") || code.includes("registration")) {
    return "Không thể đăng ký FCM. Kiểm tra VAPID key, FCM Registration API và cấu hình Firebase cùng project."
  }
  return error instanceof Error ? error.message : "Không thể hoàn tất thao tác. Vui lòng thử lại."
}
