import type * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * The body of a page in the main app, and of its loading and error states, so
 * every page shares one vertical rhythm: 24px between sections and 32px at
 * the bottom on mobile, 32px and 48px from md up. Horizontal padding comes
 * from the app shell (16px / 24px).
 */
function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page"
      className={cn("w-full min-w-0 space-y-6 pb-8 md:space-y-8 md:pb-12", className)}
      {...props}
    />
  )
}

type PageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  /** Shown from md up; below md pages offer their main action as a floating button. */
  actions?: React.ReactNode
}

function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className="flex flex-col gap-5 pt-1 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="hidden shrink-0 flex-wrap gap-2 md:flex">{actions}</div>
      ) : null}
    </header>
  )
}

/** Placeholder with the same footprint as PageHeader, for loading states. */
function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-5 pt-1 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="min-w-0 space-y-1.5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full sm:h-6" />
      </div>
      {action ? (
        <Skeleton className="hidden h-8 w-36 shrink-0 rounded-lg md:block" />
      ) : null}
    </div>
  )
}

export { Page, PageHeader, PageHeaderSkeleton }
