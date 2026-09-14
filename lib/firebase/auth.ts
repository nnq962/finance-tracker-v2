import { FirebaseError } from "firebase/app"
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

const googleProvider = new GoogleAuthProvider()

export function signInWithGoogle() {
  return signInWithPopup(firebaseAuth, googleProvider)
}

export async function syncServerSession(user: User) {
  const idToken = await user.getIdToken()
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  })

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Không thể tạo phiên đăng nhập an toàn."

    throw new Error(message)
  }
}

export async function clearServerSession() {
  const response = await fetch("/api/auth/session", { method: "DELETE" })

  if (!response.ok) {
    throw new Error("Không thể xoá phiên đăng nhập an toàn.")
  }
}

export async function signOutCurrentUser() {
  try {
    await signOut(firebaseAuth)
  } finally {
    await clearServerSession()
  }
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
