"use client"

import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import type { PaymentOutcome } from "@/lib/plans/payos"
import type { PlanState } from "@/lib/plans/plans"

import { PlanScreen } from "./plan-screen"

const title = "Gói của bạn"

type PlanOverlayProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  planState: PlanState
  /** payOS is set up, so Pro can be bought here. */
  checkoutEnabled: boolean
  /** How the payment the user just came back from stands. */
  paymentOutcome?: PaymentOutcome
  /** Names the sheet's back button, e.g. the page it returns to. */
  backLabel: string
}

/**
 * The plans over the page they were opened from: a sheet that slides in on
 * a phone, the full pricing in a dialog on wider screens.
 */
export function PlanOverlay({ open, onOpenChange, planState, checkoutEnabled, paymentOutcome, backLabel }: PlanOverlayProps) {
  const isMobile = useIsMobile()
  const screen = { planState, checkoutEnabled, paymentOutcome }

  return (
    <>
      <Sheet open={open && isMobile} onOpenChange={onOpenChange}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          variant="screen"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetNavHeader backLabel={backLabel} title={title} />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-px pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
            <PlanScreen {...screen} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={open && !isMobile} onOpenChange={onOpenChange}>
        {/* The plans scroll inside, so the close button stays in reach. */}
        <DialogContent
          aria-describedby={undefined}
          className="max-h-[calc(100dvh-4rem)] grid-rows-[minmax(0,1fr)] p-0 sm:max-w-5xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="overflow-y-auto px-6 pt-6 pb-8">
            <PlanScreen layout="page" {...screen} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
