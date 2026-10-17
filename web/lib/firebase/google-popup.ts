import {
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type PopupRedirectResolver,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

type ResolverInstance = { _initialize(auth: Auth): Promise<unknown> }
const BrowserPopupResolver = browserPopupRedirectResolver as unknown as new () => ResolverInstance

let sharedResolver: ResolverInstance | undefined

/**
 * Firebase's browser popup resolver, made once. Firebase builds the resolver
 * it is handed with `new` and keeps it; this hands back the one warmed up
 * below, so the sign in finds Google's iframe already loaded. Its prototype
 * is the resolver's, as Firebase checks what it kept is one.
 */
function SharedPopupResolver() {
  sharedResolver ??= new BrowserPopupResolver()
  return sharedResolver
}
SharedPopupResolver.prototype = BrowserPopupResolver.prototype

const googleProvider = new GoogleAuthProvider()
// Always show Google's account chooser; otherwise a browser signed in to one
// Google account is logged straight back into it after signing out.
googleProvider.setCustomParameters({ prompt: "select_account" })

/**
 * Loads Google's sign in iframe ahead of the tap. Phones and Safari only open
 * the popup if it opens straight from the tap, so it must be up by then.
 */
export function prepareGoogleSignIn() {
  SharedPopupResolver()._initialize(firebaseAuth).catch(() => undefined)
}

/*
 * Closing Google's window without picking an account: Firebase notices the
 * window closed (it looks every 2 s), then waits 8 s more in case the sign in
 * is still on its way before saying it was cancelled, so the button spun for
 * up to 10 s (2026-10-17, on an iPhone). Here, once the app is back in front
 * and Google's window is gone, 3 s without a result count as given up:
 * `onGaveUp` frees the button. A result arriving later still signs in.
 */
const GIVE_UP_AFTER_MS = 3000

export function signInWithGoogle({ onGaveUp }: { onGaveUp?: () => void } = {}) {
  // Firebase opens the window itself; keep a handle on it to see it closed.
  const open = window.open
  let popup: Window | null = null
  window.open = function (...args: Parameters<typeof window.open>) {
    window.open = open
    popup = open.apply(window, args)
    return popup
  }
  const restoreOpen = window.setTimeout(() => {
    if (window.open !== open) window.open = open
  }, 3000)

  let settled = false
  let leftApp = false
  let giveUp: number | undefined
  const away = () => {
    leftApp = true
    window.clearTimeout(giveUp)
  }
  const back = () => {
    if (!leftApp || settled || document.visibilityState !== "visible") return
    window.clearTimeout(giveUp)
    giveUp = window.setTimeout(() => {
      // A window still open (the user came back to the app beside it) is not given up on.
      if (settled || (popup && !popup.closed)) return
      settled = true
      onGaveUp?.()
    }, GIVE_UP_AFTER_MS)
  }
  const onVisibility = () => (document.visibilityState === "hidden" ? away() : back())
  window.addEventListener("blur", away)
  window.addEventListener("focus", back)
  document.addEventListener("visibilitychange", onVisibility)

  const result = signInWithPopup(firebaseAuth, googleProvider, SharedPopupResolver as unknown as PopupRedirectResolver)
  return result.finally(() => {
    settled = true
    window.clearTimeout(giveUp)
    window.clearTimeout(restoreOpen)
    if (window.open !== open) window.open = open
    window.removeEventListener("blur", away)
    window.removeEventListener("focus", back)
    document.removeEventListener("visibilitychange", onVisibility)
  })
}
