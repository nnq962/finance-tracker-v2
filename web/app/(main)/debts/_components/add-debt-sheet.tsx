"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { preloadWhenIdle } from "@/lib/preload-when-idle"

import type { AddDebtSheetProps } from "./debt-form"

/*
 * The form loads apart from the page and comes in once the page is idle
 * (2026-10-17), so the sheet's first open finds it there. Opened before then,
 * the sheet shows grey blocks where the form goes.
 */
const loadForm = () => import("./debt-form")
const DebtForm = React.lazy(() => loadForm().then((module) => ({ default: module.DebtForm })))
preloadWhenIdle(loadForm)

function DebtFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-4">
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="mx-auto h-14 w-44" />
      <SettingsGroupSkeleton caption={false} rows={3} media="none" trailing="value" chevron />
    </div>
  )
}

/**
 * A debt added or edited, laid out as the transaction sheet is: which way
 * as a segmented control, the amount large with its suggestions, the person
 * as a grid of the latest (all of them, searchable, on a deeper screen), then
 * rows for the account the money left or went into, when, when it is due and
 * a note, and switches for a debt owed from before and for interest.
 */
export function AddDebtSheet({
  debt,
  trigger,
  open: controlledOpen,
  onOpenChange,
  returnFocusRef,
  ...formProps
}: AddDebtSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [pending, setPending] = React.useState(false)

  return (
    <PageSheet
      title={debt ? "Sửa khoản nợ" : "Khoản nợ mới"}
      disabled={pending}
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return
        setOpen(nextOpen)
      }}
      trigger={
        controlledOpen === undefined
          ? (trigger ?? (
              <Button type="button" className="w-full sm:w-auto">
                <PlusIcon />
                Thêm khoản nợ
              </Button>
            ))
          : undefined
      }
      onCloseAutoFocus={(event) => {
        if (returnFocusRef?.current) {
          event.preventDefault()
          returnFocusRef.current.focus()
        }
      }}
    >
      {/* Inside the sheet, so its lists open as deeper screens; it starts over each time the sheet opens. */}
      <React.Suspense fallback={<DebtFormSkeleton />}>
        <DebtForm {...formProps} debt={debt} pending={pending} onPendingChange={setPending} onDone={() => setOpen(false)} />
      </React.Suspense>
    </PageSheet>
  )
}

