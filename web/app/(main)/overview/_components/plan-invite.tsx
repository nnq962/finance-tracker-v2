"use client"

import * as React from "react"
import { ChevronRightIcon, SparklesIcon } from "lucide-react"

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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pressable relative flex w-full items-center gap-4 overflow-hidden rounded-[28px] bg-linear-to-r from-primary via-primary to-primary/85 px-6 py-5 text-left text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-md lg:shrink-0"
        >
          {/* A dotted texture, fading out at both ends. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-15 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:10px_10px] [mask-image:linear-gradient(90deg,transparent,black_40%,transparent)]"
          />
          <SparklesIcon aria-hidden="true" className="relative size-7 shrink-0 text-ai" strokeWidth={1.7} />
          <span className="relative min-w-0 flex-1">
            <span className="block text-lg font-medium">Nâng cấp lên {plans.pro.label}</span>
            <span className="block text-sm opacity-60">
              {plans.pro.aiMonthlyLimit} lượt trợ lý AI mỗi tháng
            </span>
          </span>
          <span
            aria-hidden="true"
            className="relative grid size-11 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary"
          >
            <ChevronRightIcon className="size-5" strokeWidth={1.7} />
          </span>
        </button>
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
