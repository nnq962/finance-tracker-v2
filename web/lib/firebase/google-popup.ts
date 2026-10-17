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

export function signInWithGoogle() {
  return signInWithPopup(firebaseAuth, googleProvider, SharedPopupResolver as unknown as PopupRedirectResolver)
}
