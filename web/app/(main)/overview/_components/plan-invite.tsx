"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { PromoBanner } from "@/components/app/promo-banner"
import { PlanOverlay } from "@/components/plans/plan-overlay"
import type { PaymentOutcome } from "@/lib/plans/payos"
import { plans, type PlanState } from "@/lib/plans/plans"

type PlanInviteProps = {
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /** Back from payOS: the plans open again to show how the payment went. */
  initialOpen: boolean
}

/**
 * On Free, a dark banner inviting the user to Pro (light in the dark theme);
 * the plans open over the overview.
 */
export function PlanInvite({ planState, checkoutEnabled, paymentOutcome, initialOpen }: PlanInviteProps) {
  const [open, setOpen] = React.useState(initialOpen)

  return (
    <>
      {planState.plan === "free" ? (
        <PromoBanner
          icon={SparklesIcon}
          title={`Nâng cấp ${plans.pro.label}`}
          description={`${plans.pro.aiMonthlyLimit} lượt AI mỗi tháng`}
          onClick={() => setOpen(true)}
          className="lg:w-md lg:shrink-0"
        />
      ) : null}

      {/* Rendered on Pro too: back from payOS, it shows the payment went through. */}
      <PlanOverlay
        open={open}
        onOpenChange={setOpen}
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={paymentOutcome}
        backLabel="Tổng quan"
      />
    </>
  )
}
