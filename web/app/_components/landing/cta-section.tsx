import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Card } from "@/components/ui/card"

/** The last call, on the black lead card with its discs, the accent chip and the two ways in. */
export function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:pb-24">
      <Card variant="inverse" className="items-center rounded-[32px] px-6 py-14 text-center sm:py-20">
        <span className="rounded-full bg-ai px-3 py-1 text-xs font-semibold text-ai-foreground">Miễn phí để bắt đầu</span>
        <h2 id="cta-title" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Ghi khoản đầu tiên hôm nay.
        </h2>
        <p className="max-w-xl text-base text-inverse-foreground/60 sm:text-lg">
          Vài phút mỗi ngày, cuối tháng biết rõ tiền đã đi đâu.
        </p>
        <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/overview"
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-inverse-foreground px-7 text-base font-semibold text-inverse active:scale-[0.97]"
          >
            Mở Finance Tracker
            <ArrowRightIcon className="size-5" />
          </Link>
          <Link
            href="/login"
            className="flex h-14 items-center justify-center rounded-full bg-inverse-foreground/10 px-7 text-base font-semibold active:scale-[0.97]"
          >
            Đăng nhập
          </Link>
        </div>
      </Card>
    </section>
  )
}
