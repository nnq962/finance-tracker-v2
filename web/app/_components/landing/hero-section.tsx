import Link from "next/link"
import { ArrowRightIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { LoginCollage } from "@/app/login/_components/login-collage"

/**
 * The landing's first screen: what the app is in one line, the AI that
 * writes entries for you as the badge, the two ways in, and the app's own
 * cards as the picture (as on the sign-in page).
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto w-full max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:pt-20 lg:pb-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <a
            href="#ai"
            className="flex items-center gap-1.5 rounded-full bg-ai px-3 py-1.5 text-xs font-semibold text-ai-foreground"
          >
            <SparklesIcon className="size-3.5" />
            Nói một câu, AI ghi giúp
            <ArrowRightIcon className="size-3.5" />
          </a>
          <h1 id="hero-title" className="text-[40px] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Tiền của bạn, gọn trong một chỗ.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Finance Tracker gom thu chi, số dư tài khoản và các khoản vay nợ về một nơi, để bạn luôn biết tiền đang đi
            đâu. Cài như một app trên điện thoại, dùng được cả trên máy tính.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/overview">
                Bắt đầu miễn phí
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#tinh-nang">Xem tính năng</a>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-[32px] bg-track py-10 sm:py-16 dark:bg-foreground/5">
          <LoginCollage className="sm:scale-110" />
        </div>
      </div>
    </section>
  )
}
