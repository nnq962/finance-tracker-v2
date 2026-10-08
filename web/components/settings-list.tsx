import type * as React from "react"
import { ChevronDownIcon, ChevronRightIcon, type LucideIcon } from "lucide-react"

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
import { cn } from "@/lib/utils"

/**
 * Divider above every row but the first, as in native lists: from where the
 * row's text starts (past a 36 icon or logo and its 12 gap, when the row has
 * one) to 16 short of the card's right edge. `hasMedia` is for loading
 * skeletons, which have no ItemMedia to detect.
 */
export function settingsSeparatorClassName(hasMedia?: boolean) {
  return cn(
    "relative before:absolute before:top-0 before:right-4 before:left-4 before:h-px before:bg-border first:before:hidden has-[[data-slot=item-media]]:before:left-16",
    hasMedia && "before:left-16",
  )
}

/** A group's caption above its card, in small capitals as in iOS grouped lists: lists, forms, the filters. */
export const groupCaptionClassName = "text-xs font-semibold tracking-wider text-muted-foreground uppercase"

/**
 * Grouped list: an optional caption in small capitals, as in iOS grouped
 * lists ("HÔM NAY", "CHUNG"), a card of rows separated by dividers, and an
 * optional footnote. `collapsible` keeps the rows hidden until asked for,
 * e.g. settled loans: the caption stays in line with the other groups', with
 * "Hiện …" at its end ("Ẩn" once open).
 */
function SettingsGroup({
  title,
  action,
  header,
  footer,
  listClassName,
  size,
  collapsible,
  children,
}: {
  title?: React.ReactNode
  /** Small control at the end of the caption, e.g. to edit the group. */
  action?: React.ReactNode
  /** Shown in the card above the rows, with its own padding, e.g. the total the rows add up to. */
  header?: React.ReactNode
  footer?: React.ReactNode
  /** Lays the rows out, e.g. in columns on wide screens. */
  listClassName?: string
  /** lg: the rounder card of dashboard pages. */
  size?: "default" | "lg"
  /** The rows hidden behind the caption; `showLabel` says what opens, e.g. "Hiện 2 khoản". */
  collapsible?: { showLabel: string; defaultOpen?: boolean }
  children: React.ReactNode
}) {
  const caption = (end: React.ReactNode) =>
    title || end ? (
      <div className="flex min-h-6 items-center justify-between gap-3 px-4">
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
        <p className="px-4 text-sm text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </>
  )

  if (collapsible) {
    return (
      // Gaps, not space-y: closed, the hidden rows leave no margin.
      <Collapsible asChild defaultOpen={collapsible.defaultOpen}>
        <section className="flex flex-col gap-2">
          {caption(
            <CollapsibleTrigger className="group/trigger relative flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground outline-none after:absolute after:-inset-x-2 after:-inset-y-3 focus-visible:underline">
              <span className="group-data-[state=open]/trigger:hidden">{collapsible.showLabel}</span>
              <span className="hidden group-data-[state=open]/trigger:inline">Ẩn</span>
              <ChevronDownIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none"
              />
            </CollapsibleTrigger>,
          )}
          <CollapsibleContent className="flex flex-col gap-2">{body}</CollapsibleContent>
        </section>
      </Collapsible>
    )
  }

  return (
    <section className="space-y-2">
      {caption(action)}
      {body}
    </section>
  )
}

type SettingsRowProps = {
  icon?: LucideIcon
  /** Leading content in place of the icon, e.g. an avatar. */
  media?: React.ReactNode
  /** The icon's tile colour: a meaning colour or a category colour; grey by default. */
  tone?: IconTileTone
  title: React.ReactNode
  description?: React.ReactNode
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
}

const rowClassName = "min-h-16 gap-3 py-3"

// Item only gives links a hover state; button rows get the same one, the
// grey a native row shows under the finger (hover only exists with a mouse),
// and the selected state of the row whose screen is shown beside the list.
const pressableRow =
  "text-left transition-colors duration-150 hover:bg-muted active:bg-muted disabled:pointer-events-none disabled:opacity-50 md:data-[active=true]:bg-muted"

function SettingsRow({
  icon,
  tone,
  media,
  title,
  description,
  value,
  action,
  onClick,
  chevron = Boolean(onClick),
  active = false,
  disabled = false,
  destructive = false,
  swipeAction,
}: SettingsRowProps) {
  const content = (
    <>
      {icon || media ? (
        // Centred on the row, also beside a two-line title and description.
        <ItemMedia className="group-has-data-[slot=item-description]/item:translate-y-0 group-has-data-[slot=item-description]/item:self-center">
          {icon ? <IconTile icon={icon} tone={tone} size="sm" /> : media}
        </ItemMedia>
      ) : null}
      <ItemContent className={cn("min-w-0 gap-0.5", destructive && "items-center")}>
        <ItemTitle className={cn(destructive && "text-destructive")}>
          {title}
        </ItemTitle>
        {description ? <ItemDescription className="text-xs">{description}</ItemDescription> : null}
      </ItemContent>
      {value || action || (chevron && !destructive) ? (
        <ItemActions className="shrink-0">
          {value ? (
            <span className="text-sm text-muted-foreground">{value}</span>
          ) : null}
          {action}
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
    <Item asChild className={rowClassName}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-active={active}
        aria-current={active ? "page" : undefined}
        className={pressableRow}
      >
        {content}
      </button>
    </Item>
  ) : (
    <Item className={rowClassName}>{content}</Item>
  )

  return (
    <li className={settingsSeparatorClassName()}>
      {swipeAction ? (
        <SwipeRow onAction={swipeAction.onAction} actionLabel={swipeAction.label}>
          {row}
        </SwipeRow>
      ) : (
        row
      )}
    </li>
  )
}

export { SettingsGroup, SettingsRow, pressableRow }
