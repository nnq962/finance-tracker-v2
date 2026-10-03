"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { PlanOverlay } from "@/components/plans/plan-overlay"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

/** On Free, a card inviting the user to Pro; the plans open over the overview. */
export function PlanInvite({ planState, checkoutEnabled, paymentOutcome, initialOpen }: PlanInviteProps) {
  const [open, setOpen] = React.useState(initialOpen)

  return (
    <>
      {planState.plan === "free" ? (
        <Card size="sm" className="lg:w-md lg:shrink-0">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f2e9ff] text-[#7a4aba] dark:bg-[#3b2c54] dark:text-[#d0b2ff]">
              <SparklesIcon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-base leading-snug font-extrabold">Mở khoá {plans.pro.label}</p>
              <p className="text-sm text-muted-foreground">
                {plans.pro.aiMonthlyLimit} lượt AI/tháng, dùng sớm AI mới
              </p>
            </div>
            <Button type="button" variant="grape" className="shrink-0" onClick={() => setOpen(true)}>
              Nâng cấp
            </Button>
          </CardContent>
        </Card>
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
