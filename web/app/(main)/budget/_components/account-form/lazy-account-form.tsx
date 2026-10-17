"use client"

import * as React from "react"

import { SettingsGroupSkeleton } from "@/components/settings-list"
import { Skeleton } from "@/components/ui/skeleton"
import { preloadWhenIdle } from "@/lib/preload-when-idle"

import type { AccountForm as Form } from "./account-form"

/*
 * The form, with the banks and wallets to pick from, loads apart from the
 * page and comes in once the page is idle (2026-10-17), so a sheet's first
 * open finds it there. Opened before then: grey blocks where it goes.
 */
const loadForm = () => import("./account-form")
const LazyForm = React.lazy(() => loadForm().then((module) => ({ default: module.AccountForm })))
preloadWhenIdle(loadForm)

export function AccountForm(props: React.ComponentProps<typeof Form>) {
  return (
    <React.Suspense
      fallback={
        <div aria-hidden="true" className="flex flex-col gap-6 pb-4">
          <Skeleton className="h-11 w-full rounded-full" />
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-14 w-44" />
          </div>
          <SettingsGroupSkeleton caption={false} rows={3} media="none" trailing="value" chevron />
        </div>
      }
    >
      <LazyForm {...props} />
    </React.Suspense>
  )
}
