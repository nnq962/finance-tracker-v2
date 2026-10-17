"use client"

import * as React from "react"
import { toast } from "sonner"
import { pushErrorMessage } from "@/lib/firebase/messaging"
import { onIdTokenChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

import RootLoading from "@/app/loading"
import { SESSION_DURATION_MS } from "@/lib/auth/constants"
import { clearServerSession, syncServerSession } from "@/lib/firebase/auth"
import { firebaseAuth } from "@/lib/firebase/client"
import { stopPushDeviceSync, syncAccountPushDevice } from "@/lib/firebase/push-device"
import { isStaleDeployError, showStaleDeployToast } from "@/lib/stale-deploy"

// Back within this long after hiding the page: show it again without asking
// the server. Longer, the session may have ended meanwhile.
const RECHECK_AFTER_MS = 60_000

// The session cookie lasts 5 days and is renewed whenever the app opens with
// less than this left, so it keeps sliding while the app is used every few
// days. Renewing on every open cost a heavy request (two checks with Google,
// a new cookie, two writes) each time the app started (2026-10-17).
const RENEW_WITHIN_MS = 2 * 24 * 60 * 60 * 1000

// The sync runs by itself whenever the window regains focus, so after a deploy
// it is the first call to meet the new server: offer the reload, not an error.
function reportPushSyncError(error: unknown) {
  if (isStaleDeployError(error)) showStaleDeployToast()
  else toast.error(pushErrorMessage(error), { id: "push-device-sync" })
}

// Set on <html> while the page must stay covered. Toggled straight from the
// event handlers, so it applies before the browser paints the old content.
function cover() {
  document.documentElement.dataset.sessionCheck = "pending"
}

function uncover() {
  delete document.documentElement.dataset.sessionCheck
}

/** Full navigation, so no client-cached page of this account survives. */
function leaveToLogin() {
  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
  window.location.replace(`/login?next=${next}`)
}

export function AuthSessionGuard({
  children,
  initialUid,
  sessionExpiresAt,
  devSession = false,
}: {
  children: React.ReactNode
  initialUid: string
  /** When the server's session cookie runs out (ms since the epoch), read from its signature. */
  sessionExpiresAt: number
  /** The dev server's user from /api/dev/login: no Firebase account to follow. */
  devSession?: boolean
}) {
  const router = useRouter()
  // A ref, so a refreshed layout passing a later time does not restart the listeners.
  const sessionUntil = React.useRef(sessionExpiresAt)
  React.useEffect(() => {
    sessionUntil.current = Math.max(sessionUntil.current, sessionExpiresAt)
  }, [sessionExpiresAt])

  React.useEffect(() => {
    if (devSession) return
    let active = true

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user) => {
      if (!active) {
        return
      }

      if (!user) {
        await clearServerSession(null).catch(() => undefined)

        if (active && !firebaseAuth.currentUser) leaveToLogin()
        return
      }

      // The same account with a cookie good for a while yet: nothing to renew.
      if (user.uid === initialUid && sessionUntil.current - Date.now() > RENEW_WITHIN_MS) {
        void syncAccountPushDevice(user.uid).catch((error) => {
          if (active && firebaseAuth.currentUser?.uid === user.uid) reportPushSyncError(error)
        })
        return
      }

      try {
        await syncServerSession(user)
        sessionUntil.current = Date.now() + SESSION_DURATION_MS
        if (active && firebaseAuth.currentUser?.uid === user.uid) {
          if (user.uid !== initialUid) router.refresh()
          void syncAccountPushDevice(user.uid).catch((error) => {
            if (active && firebaseAuth.currentUser?.uid === user.uid) reportPushSyncError(error)
          })
        }
      } catch {
        if (!active || firebaseAuth.currentUser?.uid !== user.uid) return
        await clearServerSession(user.uid).catch(() => undefined)

        if (active && firebaseAuth.currentUser?.uid === user.uid) leaveToLogin()
      }
    })

    const refreshDevice = () => {
      const uid = firebaseAuth.currentUser?.uid
      if (uid && active) void syncAccountPushDevice(uid).catch((error) => {
        if (active && firebaseAuth.currentUser?.uid === uid) reportPushSyncError(error)
      })
    }
    window.addEventListener("focus", refreshDevice)

    // A page restored from memory (back/forward cache, a resumed PWA or tab)
    // shows what it rendered last time without asking the server, so keep it
    // covered until the session is confirmed.
    let check = 0
    const verifySession = async () => {
      const current = ++check
      cover()
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" })
        if (current !== check) return
        if (response.status === 401) return leaveToLogin()
        if (response.ok) {
          const { uid } = await response.json() as { uid: string }
          // Another account signed in elsewhere in this browser.
          if (uid !== initialUid) return window.location.reload()
        }
      } catch {
        // Offline: the server cannot be asked, so keep the page usable.
      }
      if (current === check) uncover()
    }

    let hiddenAt: number | null = null
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now()
        // Also keeps the content out of app-switcher snapshots.
        cover()
        return
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt
      hiddenAt = null
      if (away >= RECHECK_AFTER_MS) void verifySession()
      else uncover()
    }
    const onPageHide = (event: PageTransitionEvent) => {
      if (event.persisted) cover()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void verifySession()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("pageshow", onPageShow)

    return () => {
      active = false
      unsubscribe()
      stopPushDeviceSync()
      window.removeEventListener("focus", refreshDevice)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("pageshow", onPageShow)
      uncover()
    }
  }, [router, initialUid, devSession])

  return (
    <>
      {children}
      {/* Covers the app while the session is checked; see cover(). */}
      <div
        className="fixed inset-0 z-[100] hidden overflow-hidden [[data-session-check=pending]_&]:block"
      >
        <RootLoading />
      </div>
    </>
  )
}
