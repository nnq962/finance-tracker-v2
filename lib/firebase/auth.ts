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
    throw new Error("Unable to create a secure session.")
  }
}

export async function clearServerSession() {
  const response = await fetch("/api/auth/session", { method: "DELETE" })

  if (!response.ok) {
    throw new Error("Unable to clear the secure session.")
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
  if (!(error instanceof FirebaseError)) {
    return "Unable to sign in. Please try again."
  }

  switch (error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled."
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Please allow popups and try again."
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication."
    case "auth/network-request-failed":
      return "Unable to connect. Please check your network and try again."
    default:
      return "Unable to sign in with Google. Please try again."
  }
}
