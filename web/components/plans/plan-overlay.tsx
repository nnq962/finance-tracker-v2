"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PageSheet } from "@/components/app/page-sheet"
import { checkPaymentAction } from "@/lib/plans/actions"
import type { PaymentOutcome } from "@/lib/plans/payos"
import type { PlanState } from "@/lib/plans/plans"

import { PlanScreen } from "./plan-screen"

type PlanOverlayProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
}

/** Outcomes said once, in a toast; the rest stay on the plans as a banner (PlanScreen). */
const toastOutcomes: Partial<Record<PaymentOutcome, { kind: "success" | "error"; title: string; description?: string }>> = {
  granted: { kind: "success", title: "Đã nâng cấp Pro", description: "Cảm ơn bạn đã tin dùng Finance Tracker." },
  settled: { kind: "success", title: "Đã nâng cấp Pro", description: "Cảm ơn bạn đã tin dùng Finance Tracker." },
  cancelled: { kind: "error", title: "Thanh toán đã bị huỷ" },
  expired: { kind: "error", title: "Phiên thanh toán đã hết hạn", description: "Vui lòng thử lại." },
}

/** The plans over the page they were opened from, in a page sheet that opens with the plans' own large title. */
export function PlanOverlay({ open, onOpenChange, planState, checkoutEnabled, paymentOutcome }: PlanOverlayProps) {
  const router = useRouter()
  // Starts as the page found it, then follows a waiting payment as it settles.
  const [outcome, setOutcome] = React.useState(paymentOutcome)
  const told = React.useRef<PaymentOutcome | undefined>(undefined)

  // Back from payOS with a settled outcome: said once, then the order leaves
  // the address so a reload does not say it again. Through the router, which
  // also brings the page's plan up to date.
  React.useEffect(() => {
    const message = outcome ? toastOutcomes[outcome] : undefined
    if (!message || told.current) return
    told.current = outcome

    const url = new URL(window.location.href)
    const order = url.searchParams.get("order")
    url.searchParams.delete("order")
    router.replace(`${url.pathname}${url.search}`, { scroll: false })

    const paid = message.kind === "success" && order
    toast[message.kind](message.title, {
      id: `payment-${order}`,
      description: message.description,
      // Paid through payOS: the order writes the payment down as an expense.
      action: paid
        ? { label: "Ghi khoản chi", onClick: () => router.push(`/transactions?order=${encodeURIComponent(order)}`) }
        : undefined,
      duration: paid ? 8000 : undefined,
    })
  }, [outcome, router])

  // Still waiting: asked again every few seconds for two minutes, while the
  // app is on screen, so the banner turns into Pro without a reload.
  React.useEffect(() => {
    if (outcome !== "pending") return
    const order = new URL(window.location.href).searchParams.get("order")
    if (!order) return
    let tries = 0
    let busy = false
    const timer = window.setInterval(async () => {
      if (busy || document.visibilityState !== "visible") return
      if (++tries > 24) return window.clearInterval(timer)
      busy = true
      const next = await checkPaymentAction(order).catch(() => undefined)
      busy = false
      if (!next || next === "pending") return
      window.clearInterval(timer)
      setOutcome(next)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [outcome])

  return (
    <PageSheet title="Gói của bạn" hideTitle surface="grouped" open={open} onOpenChange={onOpenChange}>
      <PlanScreen
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={outcome && !toastOutcomes[outcome] ? outcome : undefined}
      />
    </PageSheet>
  )
}
