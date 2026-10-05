"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { PlanOverlay } from "@/components/plans/plan-overlay"
import { Button } from "@/components/ui/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
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

/** On Free, a row inviting the user to Pro; the plans open over the overview. */
export function PlanInvite({ planState, checkoutEnabled, paymentOutcome, initialOpen }: PlanInviteProps) {
  const [open, setOpen] = React.useState(initialOpen)

  return (
    <>
      {planState.plan === "free" ? (
        <Item variant="outline" className="lg:w-md lg:shrink-0">
          <ItemMedia variant="icon" className="text-ai">
            <SparklesIcon aria-hidden="true" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>Nâng cấp lên {plans.pro.label}</ItemTitle>
            <ItemDescription>
              {plans.pro.aiMonthlyLimit} lượt trợ lý AI mỗi tháng và dùng sớm tính năng mới
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button type="button" onClick={() => setOpen(true)}>
              Xem gói
            </Button>
          </ItemActions>
        </Item>
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
