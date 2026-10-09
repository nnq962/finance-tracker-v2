import type * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, type LucideIcon } from "lucide-react"

import { IconTile, type IconTileTone } from "@/components/app/icon-tile"
import { SwipeRow } from "@/components/app/swipe-row"

import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Divider above every row but the first, as in native lists: from where the
 * row's text starts (past a 36 icon or logo and its 12 gap, when the row has
 * one) to 16 short of the card's right edge. `hasMedia` is for loading
 * skeletons, which have no ItemMedia to detect.
 */
export function settingsSeparatorClassName(hasMedia?: boolean) {
  return cn(
    "relative before:absolute before:top-0 before:right-4 before:left-4 before:h-px before:bg-separator has-[[data-slot=item-media]]:before:left-16",
    // No divider above the first row showing: the first row, or one with only
    // folded-away rows (SettingsRow `collapsed`) before it.
    "[&:not(:not([data-collapsed])~*)]:before:hidden",
    // The dividers stay while a row is pressed (2026-10-10): hiding the two
    // around the row under the finger, as iOS does, read as lines flickering
    // away on every tap. A row shown beside the list on wide screens still
    // hides them, its grey running edge to edge.
    "md:has-[button[data-slot=item][data-active=true]]:before:hidden md:[:has(button[data-slot=item][data-active=true])+&]:before:hidden",
    hasMedia && "before:left-16",
  )
}

/**
 * A group's caption above its card, in small capitals as in iOS grouped lists: lists, forms, the filters.
 * A name cut with "…" inside it (truncate) clips to its line, and Safari puts
 * the stacked marks of capitals (Ể, Ấ) above a 12px line: the clipping box
 * reaches 4px further up and down, the layout unchanged.
 */
export const groupCaptionClassName =
  "text-xs font-semibold tracking-wider text-muted-foreground uppercase [&_.truncate]:-my-1 [&_.truncate]:py-1"

/** The caption row above a group's card, so groups and their skeletons line up. */
const captionRowClassName = "flex min-h-6 items-center justify-between gap-3 px-4"

/**
 * Grouped list: an optional caption in small capitals, as in iOS grouped
 * lists ("HÔM NAY", "CHUNG"), a card of rows separated by dividers, and an
 * optional footnote. `collapsible` keeps the rows hidden until asked for,
 * e.g. settled loans: the caption stays in line with the other groups', with
 * "Hiện …" at its end ("Thu gọn" once open), and the card slides open and shut.
 */
function SettingsGroup({
  title,
  action,
  header,
  footer,
  listClassName,
  size,
  collapsible,
  stickyCaption = false,
  children,
}: {
  title?: React.ReactNode
  /** Small control at the end of the caption, e.g. to edit the group. */
  action?: React.ReactNode
  /** Shown in the card above the rows, with its own padding, e.g. the total the rows add up to. */
  header?: React.ReactNode
  /** A footnote under the card, in Caption size. */
  footer?: React.ReactNode
  /** Lays the rows out, e.g. in columns on wide screens. */
  listClassName?: string
  /** lg: the rounder card of dashboard pages. */
  size?: "default" | "lg"
  /** The rows hidden behind the caption; `showLabel` says what opens, e.g. "Hiện 2 khoản". */
  collapsible?: { showLabel: string; defaultOpen?: boolean }
  /**
   * The caption stays at the top of the screen while its rows scroll under
   * it, until the next group's caption pushes it off, as section headers do in
   * iOS lists (the days of a long list). It sits on the page's own colour,
   * slightly see-through, across the screen's width on phones.
   */
  stickyCaption?: boolean
  children: React.ReactNode
}) {
  const caption = (end: React.ReactNode) =>
    title || end ? (
      <div
        className={cn(
          captionRowClassName,
          stickyCaption &&
            // A 44px band on phones (12 above the caption, 8 below it, which
            // stands in for the gap to the card), so a pinned day reads as a bar.
            // From md, under the shell's sticky header (4rem), unless a pane that
            // scrolls on its own sets --sticky-caption-top and, for a band like
            // the phone's, --sticky-caption-pad (the transactions list).
            "sticky top-[env(safe-area-inset-top,0px)] z-10 bg-background/90 pb-2 backdrop-blur-md max-md:-mx-(--main-content-px) max-md:-mt-3 max-md:min-h-11 max-md:px-[calc(var(--main-content-px)+--spacing(4))] max-md:pt-3 md:top-[var(--sticky-caption-top,4rem)] md:-mt-[var(--sticky-caption-pad,0px)] md:pt-[var(--sticky-caption-pad,0px)]",
        )}
      >
        {title ? (
          <h2 className={cn("flex min-w-0 items-center gap-1.5", groupCaptionClassName)}>
            {title}
          </h2>
        ) : null}
        {end}
      </div>
    ) : null
  const body = (
    <>
      {/* Rows carry their own padding, so the card only frames them. */}
      <Card size={size} className="gap-0 py-0">
        {header}
        <ul className={listClassName}>
          {children}
        </ul>
      </Card>
      {footer ? (
        <p className={cn("px-4 text-xs text-muted-foreground", stickyCaption && "mt-2")}>
          {footer}
        </p>
      ) : null}
    </>
  )

  if (collapsible) {
    return (
      <Collapsible asChild defaultOpen={collapsible.defaultOpen}>
        <section className="flex flex-col">
          {caption(
            // As the "Xem tất cả ›" of a section's title (SectionHeader), the chevron turning to say it folds.
            <CollapsibleTrigger className="group/trigger relative flex shrink-0 items-center gap-0.5 text-sm font-medium text-foreground/70 transition-colors outline-none after:absolute after:-inset-x-2 after:-inset-y-3 hover:text-foreground focus-visible:underline active:opacity-60">
              <span className="group-data-[state=open]/trigger:hidden">{collapsible.showLabel}</span>
              <span className="hidden group-data-[state=open]/trigger:inline">Thu gọn</span>
              <ChevronDownIcon
                aria-hidden="true"
                className="size-4 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none"
              />
            </CollapsibleTrigger>,
          )}
          {/* The space under the caption slides with the card, inside the
              content: closed, the hidden rows leave no margin. */}
          <CollapsibleContent>
            <div className="flex flex-col gap-2 pt-2">{body}</div>
          </CollapsibleContent>
        </section>
      </Collapsible>
    )
  }

  return (
    // A sticky caption brings its own space below it in its band.
    <section className={stickyCaption ? "flex flex-col" : "space-y-2"}>
      {caption(action)}
      {body}
    </section>
  )
}

type SettingsRowProps = {
  /** The row's button, e.g. to bring it into view and focus it when its field is wrong. */
  id?: string
  icon?: LucideIcon
  /** Leading content in place of the icon, e.g. an avatar. */
  media?: React.ReactNode
  /** The icon's tile colour: a meaning colour or a category colour; grey by default. */
  tone?: IconTileTone
  /** One line, cut with an ellipsis. */
  title: React.ReactNode
  /** One line under the title, cut with an ellipsis, unless `fullDescription`. */
  description?: React.ReactNode
  /** Shows the whole description, wrapped, for text the row exists to show (a note); the row grows past 64. */
  fullDescription?: boolean
  /** Summary on the right, e.g. the current choice. */
  value?: React.ReactNode
  /** Control on the right, e.g. a switch, for rows that are not buttons. */
  action?: React.ReactNode
  /** Makes the whole row a button. */
  onClick?: () => void
  /** Chevron for rows that open another screen; off for rows picking a value. */
  chevron?: boolean
  /** Highlights the row whose screen is shown next to the list (md and up). */
  active?: boolean
  disabled?: boolean
  /** Centered, red text for a destructive action such as signing out. */
  destructive?: boolean
  /** An action revealed by swiping the row left, e.g. delete. */
  swipeAction?: { label?: string; onAction: () => void }
  /**
   * Folds the row away (true) or out (false), its height sliding as it fades,
   * so the rows below move rather than jump: rows shown on request, a row
   * leaving once done. Folded, it is inert. Leave it unset for a row that
   * always shows.
   */
  collapsed?: boolean
  /**
   * Not read yet: a blue dot on the icon's corner, as on an app icon, and
   * the title in semibold (a row without an icon has the dot before its
   * title). Read, the row is like any other.
   */
  unread?: boolean
  /**
   * A row of a pick list, as in iOS: a tick at the end while chosen, nothing
   * when not, and no chevron; the tap chooses (`onClick`). Read out as a
   * pressed or unpressed button. Leave it unset for other rows.
   */
  checked?: boolean
  /** A row that unfolds something under it: whether it is unfolded, read out as such. */
  expanded?: boolean
}

const rowClassName = "min-h-16 gap-3 py-3"

// Item only gives links a hover state; button rows get the same one, the
// grey a native row shows under the finger (hover only exists with a mouse),
// and the selected state of the row whose screen is shown beside the list.
// The row is flush, so the grey fills it and the card rounds the corners.
const pressableRow =
  "text-left transition-colors duration-150 hover:bg-muted active:bg-muted disabled:pointer-events-none disabled:opacity-50 md:data-[active=true]:bg-muted"

function SettingsRow({
  id,
  icon,
  tone,
  media,
  title,
  description,
  fullDescription = false,
  value,
  action,
  onClick,
  checked,
  expanded,
  chevron = Boolean(onClick) && checked === undefined,
  active = false,
  disabled = false,
  destructive = false,
  swipeAction,
  collapsed,
  unread = false,
}: SettingsRowProps) {
  const hasMedia = Boolean(icon || media)
  // Ringed in the card's colour, so it is cut out of the icon's corner.
  const unreadDot = (className: string) => (
    <span aria-hidden="true" className={cn("rounded-full bg-transfer", className)} />
  )
  const content = (
    <>
      {hasMedia ? (
        // Centred on the row, also beside a two-line title and description.
        <ItemMedia className="relative group-has-data-[slot=item-description]/item:translate-y-0 group-has-data-[slot=item-description]/item:self-center">
          {icon ? <IconTile icon={icon} tone={tone} size="sm" /> : media}
          {unread ? unreadDot("absolute -top-1 -right-1 size-3 ring-2 ring-card") : null}
        </ItemMedia>
      ) : null}
      <ItemContent className={cn("gap-0.5", destructive && "items-center")}>
        <ItemTitle className={cn(destructive && "text-destructive", unread && "font-semibold")}>
          {unread && !hasMedia ? unreadDot("mr-1.5 inline-block size-2 shrink-0") : null}
          {title}
          {unread ? <span className="sr-only">, chưa đọc</span> : null}
        </ItemTitle>
        {description ? (
          <ItemDescription lines={fullDescription ? "all" : 1} className="text-xs">
            {description}
          </ItemDescription>
        ) : null}
      </ItemContent>
      {value || action || checked || (chevron && !destructive) ? (
        <ItemActions className="shrink-0">
          {value ? (
            <span className="text-sm text-muted-foreground">{value}</span>
          ) : null}
          {action}
          {checked ? <CheckIcon className="size-5 text-foreground" aria-hidden="true" /> : null}
          {chevron && !destructive ? (
            <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          ) : null}
        </ItemActions>
      ) : null}
    </>
  )

  // Every row is the same: 64 high (one line or title and description alike),
  // a 36 tile, 16 of padding at the sides.
  const row = onClick ? (
    <Item asChild shape="flush" className={rowClassName}>
      <button
        id={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-active={active}
        aria-current={active ? "page" : undefined}
        aria-pressed={checked}
        aria-expanded={expanded}
        className={pressableRow}
      >
        {content}
      </button>
    </Item>
  ) : (
    <Item shape="flush" className={rowClassName}>{content}</Item>
  )

  const body = swipeAction ? (
    <SwipeRow onAction={swipeAction.onAction} actionLabel={swipeAction.label}>
      {row}
    </SwipeRow>
  ) : (
    row
  )

  return <RowItem collapsed={collapsed}>{body}</RowItem>
}

/** A row's place in the list, with the divider above it; `collapsed` folds it as Collapse does, on the row itself so the list stays one list. */
function RowItem({ collapsed, children }: { collapsed?: boolean; children: React.ReactNode }) {
  if (collapsed === undefined) return <li className={settingsSeparatorClassName()}>{children}</li>

  return (
    <li
      data-collapsed={collapsed || undefined}
      inert={collapsed}
      className={cn(
        settingsSeparatorClassName(),
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </li>
  )
}

/**
 * A field set in place on a row of a group, as iOS settings do: the label on
 * the left (with an icon and a description, as SettingsRow has them), the
 * control at the end. A field typed in place (InlineInput, CurrencyInput
 * `inline`) fills the row up to the label, so a tap anywhere there brings the
 * keyboard up; a Stepper or chips sit at the end. `htmlFor` ties the label to
 * a field; leave it out for a control that names itself.
 */
function SettingsFieldRow({
  htmlFor,
  icon,
  tone,
  title,
  description,
  invalid = false,
  collapsed,
  children,
}: {
  htmlFor?: string
  icon?: LucideIcon
  tone?: IconTileTone
  title: React.ReactNode
  /** One line under the label, e.g. what the field counts in. */
  description?: React.ReactNode
  /** The label in red, for the field's error under the group. */
  invalid?: boolean
  /** As SettingsRow's: folds the row away (true) or out (false). */
  collapsed?: boolean
  children: React.ReactNode
}) {
  const Label = htmlFor ? "label" : "span"
  return (
    <RowItem collapsed={collapsed}>
      <div className="flex min-h-16 items-center gap-3 px-4 py-3">
        {icon ? (
          <span data-slot="item-media" className="flex shrink-0">
            <IconTile icon={icon} tone={tone} size="sm" />
          </span>
        ) : null}
        {/* The control keeps its width (a field at least 64), the label gives way. */}
        <Label htmlFor={htmlFor} className="flex min-w-0 shrink flex-col gap-0.5">
          <span className={cn("text-sm font-medium", invalid && "text-destructive")}>{title}</span>
          {/* Clamped rather than truncated: a long description gives way instead of widening the card. */}
          {description ? <span className="line-clamp-1 text-xs text-muted-foreground">{description}</span> : null}
        </Label>
        <div className="flex min-w-fit flex-1 items-center justify-end">{children}</div>
      </div>
    </RowItem>
  )
}

/** Bar widths taken in turn, so a column of placeholders does not look stamped. */
const skeletonTitleWidths = ["w-28", "w-36", "w-24", "w-32"]
const skeletonDescriptionWidths = ["w-20", "w-28", "w-16", "w-24"]

type SettingsRowSkeletonProps = {
  /**
   * The leading media: a 36 rounded tile (IconTile sm, AccountLogo), a 36
   * round avatar (ContactAvatar), the profile's 48 avatar, or none.
   */
  media?: "tile" | "avatar" | "avatar-lg" | "none"
  /** center: one short bar in the middle, for a centred row such as Đăng xuất. */
  align?: "start" | "center"
  /** A second, shorter bar under the title, for rows with a description. */
  description?: boolean
  /** The right side: a value (one bar), an amount over its caption (two bars, as Money and a date), or none. */
  trailing?: "value" | "amount" | "none"
  /** The chevron of rows that open another screen. */
  chevron?: boolean
  /** The row's place in its group, to vary the bar widths. */
  index?: number
}

/**
 * A loading placeholder with a SettingsRow's exact footprint: 64 high, 16 at
 * the sides, a 36 tile or avatar, the title (and description) bars, the
 * trailing value or amount, and the inset divider above it. For a group
 * whose rows differ, as children of SettingsGroupSkeleton.
 */
function SettingsRowSkeleton({
  media = "tile",
  align = "start",
  description = false,
  trailing = "none",
  chevron = false,
  index = 0,
}: SettingsRowSkeletonProps) {
  if (align === "center") {
    return (
      <div className={cn("flex min-h-16 items-center justify-center border border-transparent px-4 py-3", settingsSeparatorClassName(false))}>
        <Skeleton className="h-3.5 w-20" />
      </div>
    )
  }

  return (
    // Item's transparent 1px border included, so everything lands where the row's does.
    <div className={cn("flex min-h-16 items-center gap-3 border border-transparent px-4 py-3", settingsSeparatorClassName(media !== "none"))}>
      {media === "none" ? null : (
        <Skeleton
          className={cn(
            "shrink-0",
            media === "avatar-lg" ? "size-12 rounded-full" : media === "avatar" ? "size-9 rounded-full" : "size-9 rounded-[10px]",
          )}
        />
      )}
      {/* Bars as tall as the text (14, 12), spaced as its lines are. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className={cn("h-3.5 max-w-full", skeletonTitleWidths[index % skeletonTitleWidths.length])} />
        {description ? (
          <Skeleton className={cn("h-3 max-w-full", skeletonDescriptionWidths[index % skeletonDescriptionWidths.length])} />
        ) : null}
      </div>
      {trailing !== "none" || chevron ? (
        <div className="flex shrink-0 items-center gap-2">
          {trailing === "value" ? <Skeleton className="h-3.5 w-16" /> : null}
          {trailing === "amount" ? (
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          ) : null}
          {chevron ? <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
        </div>
      ) : null}
    </div>
  )
}

/**
 * A loading placeholder with a SettingsGroup's exact footprint, so nothing
 * moves when the list arrives: the caption row, the card (its radius from
 * `size`) and `rows` SettingsRowSkeletons that take the row options, or the
 * rows given as children when they differ. Hidden from screen readers; the
 * page says it is loading.
 *
 *   <SettingsGroupSkeleton rows={3} media="avatar" description trailing="amount" chevron />
 *   <SettingsGroupSkeleton caption={false} rows={1} trailing="value" chevron />
 */
function SettingsGroupSkeleton({
  rows = 2,
  caption = true,
  captionAction = false,
  size,
  children,
  ...row
}: Omit<SettingsRowSkeletonProps, "index"> & {
  /** How many rows; ignored when rows are given as children. */
  rows?: number
  /** A caption bar above the card, for a group with a title. */
  caption?: boolean
  /** A short bar at the caption's end, e.g. a day's totals or "Hiện …". */
  captionAction?: boolean
  /** lg: the rounder card of dashboard pages, as SettingsGroup's. */
  size?: "default" | "lg"
  /** SettingsRowSkeletons, for a group whose rows differ. */
  children?: React.ReactNode
}) {
  return (
    <div aria-hidden="true" className="space-y-2">
      {caption || captionAction ? (
        <div className={captionRowClassName}>
          {caption ? <Skeleton className="h-3 w-20" /> : null}
          {captionAction ? <Skeleton className="ml-auto h-3 w-16" /> : null}
        </div>
      ) : null}
      <Card size={size} className="gap-0 py-0">
        {children ?? Array.from({ length: rows }, (_, index) => (
          <SettingsRowSkeleton key={index} index={index} {...row} />
        ))}
      </Card>
    </div>
  )
}

export { SettingsFieldRow, SettingsGroup, SettingsGroupSkeleton, SettingsRow, SettingsRowSkeleton, pressableRow }
