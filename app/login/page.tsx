import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble"
import { LoginForm } from "@/components/login-form"
import { getSafeRedirectPath } from "@/lib/auth/redirect"
import { getSessionUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const redirectTo = getSafeRedirectPath((await searchParams).next)
  const user = await getSessionUser()

  if (user) {
    redirect(redirectTo)
  }

  return (
    <BubbleBackground interactive className="min-h-svh">
      <main className="relative z-10 flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </main>
    </BubbleBackground>
  )
}
