"use client"

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

/** The plans over the page they were opened from, in a page sheet that opens with the plans' own large title. */
export function PlanOverlay({ open, onOpenChange, planState, checkoutEnabled, paymentOutcome }: PlanOverlayProps) {
  return (
    <PageSheet title="Gói của bạn" hideTitle surface="grouped" open={open} onOpenChange={onOpenChange}>
      <PlanScreen planState={planState} checkoutEnabled={checkoutEnabled} paymentOutcome={paymentOutcome} />
    </PageSheet>
  )
}
