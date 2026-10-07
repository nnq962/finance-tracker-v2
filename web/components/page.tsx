import type * as React from "react"

import { CompactTitleBar } from "@/components/app/compact-title-bar"
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
  /** Shown from md up; below md pages offer their main action as a floating button. */
  actions?: React.ReactNode
  /**
   * Round icon buttons beside the title below lg, e.g. search and filters,
   * which sit beside the content from lg up.
   */
  accessory?: React.ReactNode
  /**
   * Below lg, takes the title row's place at the same height, e.g. an open
   * search field, so nothing under it moves.
   */
  replacement?: React.ReactNode
  /**
   * false: below md the title is only for screen readers (and the compact bar
   * once scrolled), as in native apps where the tab bar names the page.
   */
  phoneTitle?: boolean
}

/** A title only, as in native apps: what each page holds is plain from its content. */
function PageHeader({ title, actions, accessory, replacement, phoneTitle = true }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-5 pt-1 sm:flex-row sm:items-center sm:justify-between",
        !phoneTitle && "max-md:sr-only",
      )}
    >
      <div className={cn("flex min-w-0 flex-1 items-center justify-between gap-3", replacement && "max-lg:hidden")}>
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-medium tracking-tight">{title}</h1>
          {/* On phones the title moves to a small bar once scrolled away. */}
          {typeof title === "string" ? <CompactTitleBar title={title} /> : null}
        </div>
        {accessory ? <div className="flex shrink-0 gap-2 lg:hidden">{accessory}</div> : null}
      </div>
      {replacement ? <div className="min-w-0 flex-1 lg:hidden">{replacement}</div> : null}
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
      className="flex flex-col gap-5 pt-1 sm:flex-row sm:items-center sm:justify-between"
    >
      <Skeleton className="h-9 w-40" />
      {action ? (
        <Skeleton className="hidden h-8 w-36 shrink-0 md:block" />
      ) : null}
    </div>
  )
}

export { Page, PageHeader, PageHeaderSkeleton }
