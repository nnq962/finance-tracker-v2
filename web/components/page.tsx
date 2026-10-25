import type * as React from "react"

import { AppHeader, AppHeaderTitle } from "@/components/app/app-header"
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
  /** The page's name: the middle of the phone bar, from md the row's title (or for screen readers only when `lead` takes its place, or the header is `bare`). */
  title: React.ReactNode
  /**
   * One control in the name's place: in the middle of the phone bar, on the
   * left from md, e.g. Giao dịch's Chi tiêu | Vay nợ.
   */
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
  /**
   * No visible row from md up (2026-10-21): the top bar's pages already
   * name it (Tài khoản, Giao dịch), the tools and actions sit on the right
   * of a row of their own above the content, which starts under it.
   * Phones keep their bar. The name stays for screen readers.
   */
  bare?: boolean
  /** No bar on phones either: a pushed screen with its own (Settings' back bar). */
  phoneBar?: boolean
  /**
   * On phones the name in the middle of the bar and `lead` under it, across
   * the screen (2026-10-24, Giao dịch: "Giao dịch", then a large Chi tiêu |
   * Vay nợ); from md the lead on the left as ever. The lead is drawn once.
   */
  leadBelow?: boolean
}

/**
 * Every page opens with the same compact bar. On phones (2026-10-24, after
 * the user's pictures) it is AppHeader: the person on the left (Settings, the
 * PRO label on Pro), the page's name or `lead` in the middle, its round
 * buttons on the right. From md up the row of before: the name in 24px on the
 * left and the tools on the right, or (`bare`) nothing but the tools in the
 * row above the content. It scrolls away with the page.
 */
function PageHeader({ title, lead, tools, accessory, actions, bare = false, phoneBar = true, leadBelow = false }: PageHeaderProps) {
  const phoneTools = tools || accessory ? (
    <>
      {tools}
      {accessory}
    </>
  ) : null
  // Bare: on phones the bar; from md a lead stays on the left (Giao dịch | Vay nợ), anything else leaves.
  const bar = !phoneBar ? null : leadBelow && lead ? (
    <>
      <AppHeader center={<AppHeaderTitle as="p">{title}</AppHeaderTitle>} actions={phoneTools} />
      {/* Under the bar on phones; from md the row of before, on the left. */}
      <div className="mb-4 md:flex md:min-h-11 md:items-center">{lead}</div>
    </>
  ) : (
    <AppHeader
      fromMd={lead ? "lead" : "hidden"}
      center={lead ?? <AppHeaderTitle as="p">{title}</AppHeaderTitle>}
      actions={phoneTools}
    />
  )

  if (bare) {
    return (
      // contents: no box of its own, so the page's gap does not open above the content when nothing shows.
      <header data-slot="page-header" className="contents">
        <h1 className="sr-only">{title}</h1>
        {/* From md the content starts 16 under the top bar (or the row of tools). */}
        <div aria-hidden="true" className="hidden h-4 md:block" />
        {bar}
        {/* From md its tools on the right of a row of their own, drawn with the page so nothing shifts once it loads. */}
        {tools || actions || accessory ? (
          <div className="hidden items-center justify-end gap-2 md:flex">
            {tools}
            {actions ?? accessory}
          </div>
        ) : null}
      </header>
    )
  }
  return (
    <header data-slot="page-header" className="contents">
      <h1 className="sr-only md:hidden">{title}</h1>
      {/* The name only here: a lead is drawn once, in the row below (from md). */}
      {phoneBar ? <AppHeader center={<AppHeaderTitle as="p">{title}</AppHeaderTitle>} actions={phoneTools} /> : null}
      <div className={cn(pageHeaderClassName, "hidden md:flex")}>
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
      </div>
    </header>
  )
}

// 44 high on phones like the buttons in it, 16 above the content (a step
// closer than the page's 24, as the row belongs to what follows); 64 from md.
const pageHeaderClassName = "flex min-h-11 min-w-0 items-center justify-between gap-3 max-md:mb-4 md:min-h-16"
const pageTitleClassName = "min-w-0 truncate text-2xl leading-8 font-semibold tracking-tight"

/**
 * The same bar for loading states: the page's name is known, so it shows as
 * text; only what depends on data is a skeleton. On phones AppHeader's
 * footprint (the person, the middle, the round buttons); from md the row of
 * before, or nothing but a 16 gap (`bare`).
 */
function PageHeaderSkeleton({
  title,
  center = "title",
  switchBelow = false,
  lead = false,
  tools = [],
  accessory = 0,
  actions = [],
  bare = false,
}: {
  title?: string
  /** The middle of the phone bar: the name, Tổng quan's date pill, or a segmented control. */
  center?: "title" | "pill" | "switch"
  /** As PageHeader's `leadBelow`: on phones a large segmented control across the screen under the bar (Giao dịch). */
  switchBelow?: boolean
  /** From md, with `bare`: the two view titles on the left (Giao dịch's Chi tiêu, Vay nợ). */
  lead?: boolean
  /** As PageHeader's `bare`: from md up nothing but the gap under the top bar, or the view titles (`lead`). */
  bare?: boolean
  /** The round buttons on the right of the phone bar, and the tools of the row from md: a round button or a pill (the month). */
  tools?: Array<"round" | "pill">
  /** How many round buttons stand in for the actions below md. */
  accessory?: number
  /** The labelled actions from md up, as each one's width class in order, e.g. ["w-52", "w-44"]. */
  actions?: string[]
}) {
  const toolSkeletons = (className?: string) =>
    tools.map((tool, index) => (
      <Skeleton key={`tool-${index}`} className={cn("h-11 rounded-full", tool === "pill" ? "w-32" : "w-11", className)} />
    ))
  const phoneBar = (
    <div className="mb-4 grid min-h-11 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3 md:hidden">
      <Skeleton className="size-11 justify-self-start rounded-full" />
      {center === "pill" ? (
        <Skeleton className="h-11 w-52 rounded-full" />
      ) : center === "switch" ? (
        <Skeleton className="h-9 w-40 rounded-full" />
      ) : (
        <p className="truncate text-center text-[17px] font-semibold tracking-tight">{title}</p>
      )}
      <div className="flex gap-2 justify-self-end">
        {toolSkeletons()}
        {Array.from({ length: accessory }, (_, index) => (
          <Skeleton key={`accessory-${index}`} className="size-11 rounded-full" />
        ))}
      </div>
    </div>
  )

  if (bare) {
    // As PageHeader's bare form: no box of its own (contents), 16 above the content from md.
    return (
      <div aria-hidden="true" className="contents">
        <div className="hidden h-4 md:block" />
        {phoneBar}
        {switchBelow ? <Skeleton className="mb-4 h-11 rounded-full md:hidden" /> : null}
        {lead ? (
          <div className="mb-4 hidden min-h-11 items-center gap-4 md:flex">
            <Skeleton className="h-7 w-28 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ) : null}
      </div>
    )
  }
  return (
    <div aria-hidden="true" className="contents">
      {phoneBar}
      <div className={cn(pageHeaderClassName, "hidden md:flex")}>
        <p className={pageTitleClassName}>{title}</p>
        {tools.length > 0 || actions.length > 0 ? (
          <div className="flex shrink-0 items-center gap-2">
            {toolSkeletons()}
            {actions.map((width, index) => (
              <Skeleton key={`action-${index}`} className={cn("h-11 rounded-full", width)} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { Page, PageHeader, PageHeaderSkeleton }
