import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants"
import { getFirebaseAdminAuth } from "@/lib/firebase/admin"

export type SessionUser = {
  uid: string
  name: string
  email: string
  avatar: string
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return null
  }

  try {
    const decodedToken = await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    )

    return {
      uid: decodedToken.uid,
      name:
        decodedToken.name ??
        decodedToken.email?.split("@")[0] ??
        "Người dùng",
      email: decodedToken.email ?? "",
      avatar: decodedToken.picture ?? "",
    }
  } catch {
    return null
  }
})

export async function requireSession() {
  const user = await getSessionUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
