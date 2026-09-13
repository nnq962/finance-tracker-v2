import { BubbleBackground } from "@/components/animate-ui/components/backgrounds/bubble"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <BubbleBackground interactive className="min-h-svh">
      <main className="relative z-10 flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </main>
    </BubbleBackground>
  )
}
