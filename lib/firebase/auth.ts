import { FirebaseError } from "firebase/app"
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"
import { stopPushDeviceSync, unregisterLocalPushDevice } from "@/lib/firebase/push-device"

const googleProvider = new GoogleAuthProvider()

export function signInWithGoogle() {
  return signInWithPopup(firebaseAuth, googleProvider)
}

// Serialize cookie mutations so late login/refresh requests cannot undo logout.
let sessionQueue: Promise<unknown> = Promise.resolve()
function queueSession<T>(operation: () => Promise<T>): Promise<T> {
  const work = sessionQueue.then(operation, operation)
  sessionQueue = work.catch(() => undefined)
  return work
}

export function syncServerSession(user: User) {
  return queueSession(async () => {
    if (firebaseAuth.currentUser?.uid !== user.uid) return
    const idToken = await user.getIdToken()
    if (firebaseAuth.currentUser?.uid !== user.uid) return
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null)
      const message = typeof body === "object" && body !== null &&
        "error" in body && typeof body.error === "string"
        ? body.error : "Không thể tạo phiên đăng nhập an toàn."
      throw new Error(message)
    }
  })
}

export function clearServerSession(expectedUid?: string | null) {
  return queueSession(async () => {
    if (expectedUid !== undefined && (firebaseAuth.currentUser?.uid ?? null) !== expectedUid) return
    stopPushDeviceSync()
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE" })
      if (!response.ok) throw new Error("Không thể xoá phiên đăng nhập an toàn.")
    } finally {
      await unregisterLocalPushDevice().catch(() => undefined)
    }
  })
}

export async function signOutCurrentUser() {
  const uid = firebaseAuth.currentUser?.uid
  // Detach durably while the session is available; surface failures for retry.
  await clearServerSession(uid)
  if (firebaseAuth.currentUser?.uid === uid) await signOut(firebaseAuth)
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && !(error instanceof FirebaseError)) {
    return error.message
  }

  if (!(error instanceof FirebaseError)) {
    return "Không thể đăng nhập. Vui lòng thử lại."
  }

  switch (error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Đăng nhập bằng Google đã bị huỷ."
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép cửa sổ bật lên và thử lại."
    case "auth/unauthorized-domain":
      return "Tên miền này chưa được cấp quyền trong Firebase Authentication."
    case "auth/network-request-failed":
      return "Không thể kết nối. Vui lòng kiểm tra mạng và thử lại."
    default:
      return "Không thể đăng nhập bằng Google. Vui lòng thử lại."
  }
}
