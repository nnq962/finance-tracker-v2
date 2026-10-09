import type { Metadata, Viewport } from "next"
import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { getSafeRedirectPath } from "@/lib/auth/redirect"
import { getSessionUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"

import { LoginCollage } from "./_components/login-collage"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào Finance Tracker để quản lý tài chính cá nhân.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
}

// The page's own canvas, as the app's (see the root layout).
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  viewportFit: "cover",
}

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

  // On phones: the name at the top, the app's cards as the picture in the
  // middle, the title and Google's button at the bottom, in the thumb's reach.
  // From lg up: the picture in a panel on the left, the sign in on the right.
  return (
    <main className="surface-grouped min-h-svh bg-background text-foreground">
      <div className="mx-auto grid min-h-svh max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
        <div className="flex min-h-svh flex-col px-6 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] lg:order-2 lg:min-h-0 lg:py-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Image src="/icon.svg" alt="" width={28} height={28} className="size-7" />
            Finance Tracker
          </p>
          <div className="flex flex-1 items-center py-8 lg:hidden">
            <LoginCollage />
          </div>
          <div className="flex flex-col gap-6 lg:mt-16">
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] leading-tight font-semibold tracking-tight lg:text-4xl">
                Tiền của bạn, gọn trong một chỗ
              </h1>
              <p className="text-base text-muted-foreground">
                Ghi thu chi, theo dõi tài khoản và vay nợ. Nói một câu, AI ghi giúp.
              </p>
            </div>
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
        <div className="hidden h-[min(42rem,85svh)] items-center justify-center rounded-[32px] bg-track lg:order-1 lg:flex dark:bg-foreground/5">
          <LoginCollage className="scale-125" />
        </div>
      </div>
    </main>
  )
}
