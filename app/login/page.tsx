import GradientWaves from "@/components/gradient-waves"
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
    <div className="relative isolate min-h-svh overflow-hidden bg-black">
      <div className="absolute inset-0">
        <GradientWaves
          horizonColor="#000000"
          waveColor="#6366F1"
          crestColor="#ffffff"
          speed={0.4}
          amplitude={4}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1}
          opacity={1}
          mouseInteraction
          parallaxStrength={0.5}
          grain
          grainIntensity={0.05}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-black/30" aria-hidden="true" />
      <main className="pointer-events-none relative z-10 flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="pointer-events-auto w-full max-w-sm">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </main>
    </div>
  )
}
