"use client"

import * as React from "react"

import { AddAccountSheet } from "@/app/(main)/budget/_components/add-account/add-account-sheet"
import { StepFlow } from "@/components/app/step-flow"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { markOnboardingSeenAction } from "@/lib/onboarding/actions"
import { plans } from "@/lib/plans/plans"
import { cn } from "@/lib/utils"

import {
  AccountsPicture,
  AddTransactionPicture,
  AiPicture,
  DebtsPicture,
  OverviewPicture,
} from "./welcome-pictures"

type Slide = {
  title: string
  body: string
  picture: React.ReactNode
  /** The picture's backdrop, a light wash of a meaning colour, a different one each screen. */
  backdrop: string
}

const slides: Slide[] = [
  {
    title: "Mọi đồng tiền, một nơi",
    body: "Số dư, thu chi và vay nợ của bạn, gọn trong một ứng dụng.",
    picture: <AccountsPicture />,
    backdrop: "bg-transfer/10",
  },
  {
    title: "Ghi một khoản trong vài giây",
    body: "Chạm +, nhập số tiền, chọn hạng mục. Số dư tài khoản tự cập nhật.",
    picture: <AddTransactionPicture />,
    backdrop: "bg-warning/15",
  },
  {
    title: "Hoặc chỉ cần nói",
    body: `Nói hay gõ như nhắn tin, AI ghi giúp số tiền, hạng mục và tài khoản. Gói Free có ${plans.free.aiMonthlyLimit} lượt mỗi tháng.`,
    picture: <AiPicture />,
    backdrop: "bg-ai/10",
  },
  {
    title: "Biết tiền đi đâu",
    body: "Tổng quan cho thấy thu chi từng tháng và mỗi hạng mục chiếm bao nhiêu.",
    picture: <OverviewPicture />,
    backdrop: "bg-income/10",
  },
  {
    title: "Không quên khoản nào",
    body: "Ghi cho vay, đi vay kèm hạn trả; mỗi tối nhắc bạn ghi chi tiêu.",
    picture: <DebtsPicture />,
    backdrop: "bg-expense/10",
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
 * The first-run welcome, and the guide opened again from Settings: five
 * screens, each a large picture of the app's own blocks on a light wash, a
 * title and one line, stepped through with StepFlow (swipe, dots, ‹ and
 * Tiếp). Bỏ qua at the top until the last screen. Shown once per user (on any
 * device); the first time, finishing opens "add account", which every other
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
  const [step, setStep] = React.useState(0)
  const [addAccountOpen, setAddAccountOpen] = React.useState(false)
  const isFirstRun = React.useRef(firstRun)
  const last = step === slides.length - 1

  const close = (finished: boolean) => {
    setOpen(false)
    if (isFirstRun.current) {
      isFirstRun.current = false
      void markOnboardingSeenAction().catch(() => {})
      if (finished) setAddAccountOpen(true)
    }
  }

  const value = React.useMemo(() => ({
    openWelcome: () => {
      setStep(0)
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
          variant="screen"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetTitle className="sr-only">Hướng dẫn sử dụng</SheetTitle>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
            {/* Bỏ qua fades out on the last screen, where Bắt đầu does the same. */}
            <div className="flex h-15 shrink-0 items-center justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                inert={last}
                className={cn("transition-opacity duration-200 motion-reduce:transition-none", last && "opacity-0")}
                onClick={() => close(false)}
              >
                Bỏ qua
              </Button>
            </div>
            <StepFlow
              label="Giới thiệu Finance Tracker"
              step={step}
              onStepChange={setStep}
              doneLabel="Bắt đầu"
              onDone={() => close(true)}
              className="flex-1"
              steps={slides.map(({ title, body, picture, backdrop }) => ({
                key: title,
                label: title,
                content: (
                  <>
                    {/* A drawing of the app: not to be tapped or read, the words under it say it. */}
                    <div
                      inert
                      aria-hidden="true"
                      className={cn("flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[28px] px-5 py-6", backdrop)}
                    >
                      {picture}
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight text-balance">{title}</h2>
                    <p className="mt-2 px-2 text-center text-[15px] text-muted-foreground text-balance">{body}</p>
                  </>
                ),
              }))}
            />
          </div>
        </SheetContent>
      </Sheet>
      <AddAccountSheet open={addAccountOpen} onOpenChange={setAddAccountOpen} />
    </WelcomeContext.Provider>
  )
}
