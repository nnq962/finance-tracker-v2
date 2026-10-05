"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { PlanOverlay } from "@/components/plans/plan-overlay"
import { Button } from "@/components/ui/button"
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

/** On Free, a pill inviting the user to Pro; the plans open over the overview. */
export function PlanInvite({ planState, checkoutEnabled, paymentOutcome, initialOpen }: PlanInviteProps) {
  const [open, setOpen] = React.useState(initialOpen)

  return (
    <>
      {planState.plan === "free" ? (
        // A small pill beside the greeting, as an app's "Upgrade" chip,
        // rather than a card that pushes the overview down.
        <Button type="button" variant="grape" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
          <SparklesIcon data-icon="inline-start" aria-hidden="true" />
          Nâng cấp {plans.pro.label}
        </Button>
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
