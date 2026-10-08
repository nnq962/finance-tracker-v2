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
  /**
   * Small capitals above the title that set the page in context: the date,
   * the month shown, how many there are. A control fits too (the month).
   */
  eyebrow?: React.ReactNode
  /** The small bar's title once the large one scrolls away; `title` itself when it is text. */
  compactTitle?: string
  /** Shown from md up; below md pages offer their main action as a floating button. */
  actions?: React.ReactNode
  /**
   * Round icon buttons beside the title, e.g. the people on Vay nợ: the phone
   * form of `actions`, so below md only when there are actions, else always.
   */
  accessory?: React.ReactNode
}

/**
 * Every page opens the same way, on phones as on desktop: the eyebrow, the
 * large title, at most a round button or two beside it. Learn one page and
 * the others read the same.
 */
function PageHeader({ title, eyebrow, compactTitle, actions, accessory }: PageHeaderProps) {
  const barTitle = compactTitle ?? (typeof title === "string" ? title : undefined)

  return (
    <header
      data-slot="page-header"
      className="flex flex-col gap-5 pt-1 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-1 flex min-h-5 items-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-[32px] leading-10 font-semibold tracking-tight">{title}</h1>
          {/* On phones the title moves to a small bar once scrolled away. */}
          {barTitle ? <CompactTitleBar title={barTitle} /> : null}
        </div>
        {accessory ? <div className={cn("flex shrink-0 gap-2", actions && "md:hidden")}>{accessory}</div> : null}
      </div>
      {actions ? (
        <div className="hidden shrink-0 flex-wrap gap-2 md:flex">{actions}</div>
      ) : null}
    </header>
  )
}

/** Placeholder with the same footprint as PageHeader, for loading states. */
function PageHeaderSkeleton({
  action = false,
  accessory = 0,
}: {
  /** The page has actions from md up. */
  action?: boolean
  /** How many round buttons sit beside the title (below md when there are actions). */
  accessory?: number
}) {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-5 pt-1 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex h-5 items-center">
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="flex h-10 items-center">
            <Skeleton className="h-8 w-44" />
          </div>
        </div>
        {accessory > 0 ? (
          <div className={cn("flex shrink-0 gap-2", action && "md:hidden")}>
            {Array.from({ length: accessory }, (_, index) => (
              <Skeleton key={index} className="size-11 rounded-full" />
            ))}
          </div>
        ) : null}
      </div>
      {action ? (
        <Skeleton className="hidden h-11 w-36 shrink-0 rounded-full md:block" />
      ) : null}
    </div>
  )
}

export { Page, PageHeader, PageHeaderSkeleton }
