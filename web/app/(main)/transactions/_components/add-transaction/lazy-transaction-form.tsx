"use client"

import * as React from "react"

import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Skeleton } from "@/components/ui/skeleton"
import { preloadWhenIdle } from "@/lib/preload-when-idle"

import type { TransactionForm as Form } from "./transaction-form"

/*
 * The form loads apart from the page and comes in once the page is idle
 * (2026-10-17), so a sheet's first open finds it there. Opened before then,
 * the sheet shows the form's tabs and grey rows where its fields go.
 */
const loadForm = () => import("./transaction-form")
const LazyForm = React.lazy(() => loadForm().then((module) => ({ default: module.TransactionForm })))
preloadWhenIdle(loadForm)

export function TransactionForm(props: React.ComponentProps<typeof Form>) {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col gap-6 pb-4">
          {props.header}
          <Skeleton className="mx-auto h-14 w-44" />
          <SettingsGroupSkeleton caption={false} rows={2} media="none" trailing="value" chevron />
          <SettingsGroupSkeleton caption={false} rows={2} media="none" trailing="value" chevron />
        </div>
      }
    >
      <LazyForm {...props} />
    </React.Suspense>
  )
}
