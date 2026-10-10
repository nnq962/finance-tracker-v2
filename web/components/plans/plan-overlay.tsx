"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PageSheet } from "@/components/app/page-sheet"
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
  const told = React.useRef(false)

  // Back from payOS with a settled outcome: said once, then the order leaves
  // the address so a reload does not say it again.
  React.useEffect(() => {
    const message = paymentOutcome ? toastOutcomes[paymentOutcome] : undefined
    if (!message || told.current) return
    told.current = true

    const url = new URL(window.location.href)
    const order = url.searchParams.get("order")
    url.searchParams.delete("order")
    window.history.replaceState(window.history.state, "", url)

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
  }, [paymentOutcome, router])

  return (
    <PageSheet title="Gói của bạn" hideTitle surface="grouped" open={open} onOpenChange={onOpenChange}>
      <PlanScreen
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={paymentOutcome && !toastOutcomes[paymentOutcome] ? paymentOutcome : undefined}
      />
    </PageSheet>
  )
}
