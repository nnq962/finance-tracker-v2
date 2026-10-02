"use client"

import * as React from "react"
import {
  BellRingIcon,
  CalendarDaysIcon,
  ReceiptTextIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"

import { AddAccountSheet } from "@/app/(main)/budget/_components/add-account/add-account-sheet"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetTitle } from "@/components/ui/sheet"
import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import { markOnboardingSeenAction } from "@/lib/onboarding/actions"
import { cn } from "@/lib/utils"

type Slide = {
  icon: LucideIcon
  color: CategoryColorName
  title: string
  body: string
}

const slides: Slide[] = [
  {
    icon: WalletCardsIcon,
    color: "blue",
    title: "Chào mừng đến với Finance Tracker",
    body: "Theo dõi số dư, thu chi và các khoản vay nợ của bạn ở một nơi.",
  },
  {
    icon: ReceiptTextIcon,
    color: "orange",
    title: "Ghi thu chi trong vài giây",
    body: "Bấm “Thêm giao dịch”, chọn hạng mục và nhập số tiền. Số dư tài khoản tự cập nhật.",
  },
  {
    icon: CalendarDaysIcon,
    color: "emerald",
    title: "Biết mỗi ngày tiêu bao nhiêu",
    body: "Lịch và biểu đồ phân bổ ở trang Tổng quan cho thấy tiền đi đâu, vào ngày nào.",
  },
  {
    icon: BellRingIcon,
    color: "violet",
    title: "Vay nợ và lời nhắc",
    body: "Ghi lại khoản cho vay, đi vay kèm hạn trả, và bật lời nhắc mỗi tối để không quên ghi chi tiêu.",
  },
]

const WelcomeContext = React.createContext<{ openWelcome: () => void }>({
  openWelcome: () => {},
})

/** Opens the welcome screens again, e.g. from Settings. */
export function useWelcome() {
  return React.useContext(WelcomeContext)
}

/**
 * The first-run welcome: four short screens shown once per user (on any
 * device). The first time, finishing opens "add account", which every other
 * step needs.
 */
export function WelcomeProvider({
  firstRun,
  children,
}: {
  firstRun: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(firstRun)
  const [index, setIndex] = React.useState(0)
  const [addAccountOpen, setAddAccountOpen] = React.useState(false)
  const isFirstRun = React.useRef(firstRun)
  const touchStart = React.useRef<number | null>(null)
  const slide = slides[index]
  const isLast = index === slides.length - 1
  const Icon = slide.icon

  const close = (finished: boolean) => {
    setOpen(false)
    if (isFirstRun.current) {
      isFirstRun.current = false
      void markOnboardingSeenAction().catch(() => {})
      if (finished) setAddAccountOpen(true)
    }
  }

  const go = (next: number) => setIndex(Math.min(Math.max(next, 0), slides.length - 1))

  const value = React.useMemo(() => ({
    openWelcome: () => {
      setIndex(0)
      setOpen(true)
    },
  }), [])

  return (
    <WelcomeContext.Provider value={value}>
      {children}
      <Sheet open={open} onOpenChange={(next) => { if (!next) close(false) }}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-0 data-[side=right]:w-full sm:max-w-md!"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="flex justify-end p-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => close(false)}>
              Bỏ qua
            </Button>
          </div>
          {/* Swipe left or right to move between screens. */}
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8 pb-8 text-center"
            onTouchStart={(event) => { touchStart.current = event.touches[0].clientX }}
            onTouchEnd={(event) => {
              if (touchStart.current === null) return
              const delta = event.changedTouches[0].clientX - touchStart.current
              touchStart.current = null
              if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1))
            }}
          >
            <span
              className={cn(
                "flex size-24 items-center justify-center rounded-3xl",
                getCategoryColor(slide.color).surfaceClassName,
              )}
            >
              <Icon className="size-12" aria-hidden="true" />
            </span>
            <div className="space-y-2">
              <SheetTitle className="text-xl">{slide.title}</SheetTitle>
              <p className="text-muted-foreground" aria-live="polite">{slide.body}</p>
            </div>
          </div>
          {/* SheetFooter keeps the button clear of the Home indicator, as in other sheets. */}
          <SheetFooter className="gap-4">
            <div className="flex justify-center gap-2" aria-label={`Trang ${index + 1} trên ${slides.length}`}>
              {slides.map((item, dot) => (
                <button
                  key={item.title}
                  type="button"
                  aria-label={`Trang ${dot + 1}`}
                  aria-current={dot === index ? "step" : undefined}
                  onClick={() => go(dot)}
                  className={cn(
                    "h-2 rounded-full bg-muted-foreground/30 transition-all",
                    dot === index ? "w-6 bg-[#38b8f6]" : "w-2",
                  )}
                />
              ))}
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => (isLast ? close(true) : go(index + 1))}
            >
              {isLast ? "Bắt đầu" : "Tiếp"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AddAccountSheet open={addAccountOpen} onOpenChange={setAddAccountOpen} />
    </WelcomeContext.Provider>
  )
}
