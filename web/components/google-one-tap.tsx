"use client"

import { useCallback, useEffect } from "react"
import Script from "next/script"
import { toast } from "sonner"

import { firebaseAuth } from "@/lib/firebase/client"
import { getAuthErrorMessage, signInWithGoogleIdToken, syncServerSession } from "@/lib/firebase/auth"

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

type GoogleId = {
  initialize(options: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    context?: "signin" | "signup" | "use"
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
  }): void
  prompt(): void
  cancel(): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } }
  }
}

/**
 * Google's One Tap: its own prompt listing the Google accounts the browser
 * is signed in to, so a visitor signs in with one tap. Shown only to someone
 * not signed in to Timi, and only where Google offers it (a browser signed
 * in to Google; seldom in Safari on iOS). Renders nothing of its own.
 */
export function GoogleOneTap({ redirectTo = "/overview" }: { redirectTo?: string }) {
  const handleCredential = useCallback(
    async ({ credential }: { credential: string }) => {
      try {
        const result = await signInWithGoogleIdToken(credential)
        await syncServerSession(result.user)
        // Full navigation, as the sign in button does (see LoginForm).
        window.location.replace(redirectTo)
      } catch (error) {
        toast.error(getAuthErrorMessage(error))
      }
    },
    [redirectTo],
  )

  const prompt = useCallback(async () => {
    const id = window.google?.accounts.id
    if (!id || !CLIENT_ID) return
    // The landing page is shown to everyone: no prompt for someone already in.
    await firebaseAuth.authStateReady()
    if (firebaseAuth.currentUser) return
    id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
      use_fedcm_for_prompt: true,
    })
    id.prompt()
  }, [handleCredential])

  useEffect(() => () => window.google?.accounts.id.cancel(), [])

  if (!CLIENT_ID) return null
  return <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => void prompt()} />
}
