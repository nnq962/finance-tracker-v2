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
  /** The page's name: the bar's title, or for screen readers only when `lead` takes its place. */
  title: React.ReactNode
  /** Takes the title's place on the left, e.g. the home's avatar and greeting. */
  lead?: React.ReactNode
  /** Controls on every size, before the actions: the month shown, the notifications bell. */
  tools?: React.ReactNode
  /**
   * Round icon buttons: the phone form of `actions`, so below md when there
   * are actions, else always. E.g. the people on Vay nợ.
   */
  accessory?: React.ReactNode
  /** Labelled buttons from md up; below md pages offer their main action as a floating button. */
  actions?: React.ReactNode
}

/**
 * Every page opens with the same compact row, as in Vietnamese banking apps:
 * the page's name in 24px on the left and its tools on the right. It scrolls
 * away with the page. The home puts the user's avatar and greeting in the
 * name's place.
 */
function PageHeader({ title, lead, tools, accessory, actions }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={pageHeaderClassName}>
      {lead ? (
        <>
          <h1 className="sr-only">{title}</h1>
          {lead}
        </>
      ) : (
        <h1 className={pageTitleClassName}>{title}</h1>
      )}
      {tools || accessory || actions ? (
        <div className="flex shrink-0 items-center gap-2">
          {tools}
          {accessory ? <div className={cn("flex gap-2", actions && "md:hidden")}>{accessory}</div> : null}
          {actions ? <div className="hidden flex-wrap gap-2 md:flex">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  )
}

// 44 high on phones like the buttons in it, 16 above the content (a step
// closer than the page's 24, as the row belongs to what follows); 64 from md.
const pageHeaderClassName = "flex min-h-11 min-w-0 items-center justify-between gap-3 max-md:mb-4 md:min-h-16"
const pageTitleClassName = "min-w-0 truncate text-2xl leading-8 font-semibold tracking-tight"

/**
 * The same bar for loading states: the page's name is known, so it shows as
 * text; only what depends on data (the home's avatar and name) is a skeleton.
 */
function PageHeaderSkeleton({
  title,
  lead = false,
  tools = 0,
  action = false,
}: {
  title?: string
  /** The home's avatar and greeting in the title's place. */
  lead?: boolean
  /** How many round tools sit on the right on phones. */
  tools?: number
  /** The page has labelled actions from md up. */
  action?: boolean
}) {
  return (
    <div aria-hidden="true" className={pageHeaderClassName}>
      {lead ? (
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ) : (
        <p className={pageTitleClassName}>{title}</p>
      )}
      {tools > 0 || action ? (
        <div className="flex shrink-0 gap-2">
          {Array.from({ length: tools }, (_, index) => (
            <Skeleton key={index} className={cn("size-11 rounded-full", action && "md:hidden")} />
          ))}
          {action ? <Skeleton className="hidden h-11 w-36 rounded-full md:block" /> : null}
        </div>
      ) : null}
    </div>
  )
}

export { Page, PageHeader, PageHeaderSkeleton }
