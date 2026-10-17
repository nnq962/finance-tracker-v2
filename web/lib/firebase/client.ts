import { getApp, getApps, initializeApp } from "firebase/app"
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig)

// getAuth's own setup minus the popup resolver: with it, phones and Safari
// load Google's iframe (gapi, /__/auth/iframe, getProjectConfig) on every page
// and hold the signed-in user back until it is up. Only /login needs it; see
// lib/firebase/google-popup.ts. The same options again (a hot reload) return
// the same instance.
export const firebaseAuth = typeof window === "undefined"
  ? getAuth(firebaseApp)
  : initializeAuth(firebaseApp, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  })
