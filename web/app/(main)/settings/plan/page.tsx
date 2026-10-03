import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Page } from "@/components/page"
import { Button } from "@/components/ui/button"
import { loadWithSession } from "@/lib/auth/session"
import { checkReturningPayment, getPayOS } from "@/lib/plans/payos"
import { getPlanState } from "@/lib/plans/repository"

import { PlanScreen } from "../_components/plan-screen"

export const metadata: Metadata = {
  title: "Gói Pro",
}

/** The plans as a full pricing page, opened from settings on wider screens. */
export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order } = await searchParams
  const {
    data: [planState, paymentOutcome],
  } = await loadWithSession(async (user) => {
    // Settled first, so the plan read next already shows it.
    const paymentOutcome = await checkReturningPayment(user.uid, order)
    return Promise.all([getPlanState(user.uid), paymentOutcome])
  })

  return (
    <Page>
      {/* Desktop has the sidebar; on a phone this is the way back. */}
      <Button asChild variant="ghost" size="sm" className="md:hidden">
        <Link href="/settings">
          <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
          Cài đặt
        </Link>
      </Button>
      <PlanScreen
        layout="page"
        planState={planState}
        checkoutEnabled={getPayOS() !== null}
        paymentOutcome={paymentOutcome}
      />
    </Page>
  )
}
