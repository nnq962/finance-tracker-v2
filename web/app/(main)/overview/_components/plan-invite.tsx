"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import { PromoBanner } from "@/components/app/promo-banner"
import { SettingsRow } from "@/components/settings-list"
import { PlanOverlay } from "@/components/plans/plan-overlay"
import type { PaymentOutcome } from "@/lib/plans/payos"
import { plans, type PlanState } from "@/lib/plans/plans"

const proTitle = `Nâng cấp ${plans.pro.label}`
const proDescription = `${plans.pro.aiMonthlyLimit} lượt AI mỗi tháng`

/** Opens the plans; null on Pro, where there is nothing to invite to. */
const PlanInviteContext = React.createContext<(() => void) | null>(null)

/**
 * The overview's invitation to Pro and the plans it opens over the page. The
 * invitation sits with what else gives AI credits: a row at the end of the
 * missions while there are any (PlanInviteRow), then, once they are all
 * claimed, a banner in their place below net worth (PlanInviteBanner).
 */
export function PlanInviteProvider({
  planState,
  checkoutEnabled,
  paymentOutcome,
  initialOpen,
  children,
}: {
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /** Back from payOS: the plans open again to show how the payment went. */
  initialOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(initialOpen)
  const openPlans = React.useCallback(() => setOpen(true), [])

  return (
    <PlanInviteContext value={planState.plan === "free" ? openPlans : null}>
      {children}
      {/* Rendered on Pro too: back from payOS, it shows the payment went through. */}
      <PlanOverlay
        open={open}
        onOpenChange={setOpen}
        planState={planState}
        checkoutEnabled={checkoutEnabled}
        paymentOutcome={paymentOutcome}
      />
    </PlanInviteContext>
  )
}

/** The invitation as the missions' last row, the other way to more AI credits. Nothing on Pro. */
export function PlanInviteRow() {
  const openPlans = React.useContext(PlanInviteContext)
  if (!openPlans) return null

  return <SettingsRow icon={SparklesIcon} tone="ai" title={proTitle} description={proDescription} onClick={openPlans} />
}

/** The invitation on its own light card, once the missions are done. Nothing on Pro. */
export function PlanInviteBanner() {
  const openPlans = React.useContext(PlanInviteContext)
  if (!openPlans) return null

  return <PromoBanner icon={SparklesIcon} title={proTitle} description={proDescription} onClick={openPlans} />
}

/** Whether there is a Pro invitation to show, i.e. the user is on Free. */
export function useHasPlanInvite() {
  return React.useContext(PlanInviteContext) !== null
}
