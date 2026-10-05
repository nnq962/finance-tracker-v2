import type * as React from "react"
import { ChevronRightIcon, type LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  getCategoryColor,
  type CategoryColorName,
} from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

/**
 * Separator above every row but the first, as in iOS: it starts where the
 * row's text starts (after the 32px icon, or at the text when there is none)
 * and runs to the card's right edge. Exported for loading skeletons.
 */
export function settingsSeparatorClassName(hasMedia: boolean) {
  return cn(
    // -right-1 crosses the list's 4px side padding to reach the card's edge.
    "relative before:absolute before:top-0 before:-right-1 before:h-px before:bg-border first:before:hidden",
    // Row padding (12px), plus the icon (32px) and gap (10px) when present.
    hasMedia ? "before:left-[3.375rem]" : "before:left-3",
  )
}

/**
 * Grouped list in the style of native settings screens: an optional caption,
 * a flat card of rows separated by dividers, and an optional footnote.
 */
function SettingsGroup({
  title,
  action,
  header,
  footer,
  listClassName,
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
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      {title || action ? (
        <div className="flex min-h-6 items-center justify-between gap-3 px-3">
          {title ? (
            <h2 className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
              {title}
            </h2>
          ) : null}
          {action}
        </div>
      ) : null}
      {/* Rows carry their own, equal padding, so the card only frames them:
          first and last rows match the ones in between. */}
      <Card size="sm" className="gap-0 py-0">
        {header}
        <ul className={cn("px-1", listClassName)}>
          {children}
        </ul>
      </Card>
      {footer ? (
        <p className="px-3 text-xs leading-relaxed text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </section>
  )
}

type SettingsRowProps = {
  icon?: LucideIcon
  /** Leading content in place of the icon tile, e.g. an avatar. */
  media?: React.ReactNode
  color?: CategoryColorName
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
}

// Item has no pressed state for button rows: a grey wash when hovered,
// pressed or selected.
const pressableRow =
  "text-left transition-colors hover:bg-secondary/60 active:bg-secondary disabled:pointer-events-none disabled:opacity-50 md:data-[active=true]:bg-secondary"

function SettingsRow({
  icon: Icon,
  media,
  color = "slate",
  title,
  description,
  value,
  action,
  onClick,
  chevron = Boolean(onClick),
  active = false,
  disabled = false,
  destructive = false,
}: SettingsRowProps) {
  const content = (
    <>
      {Icon ? (
        <ItemMedia
          className={cn("size-8 rounded-lg", getCategoryColor(color).surfaceClassName)}
        >
          <Icon className="size-4" aria-hidden="true" />
        </ItemMedia>
      ) : media ? (
        <ItemMedia>{media}</ItemMedia>
      ) : null}
      <ItemContent className={cn("min-w-0", destructive && "items-center")}>
        <ItemTitle
          className={cn(destructive && "text-expense")}
        >
          {title}
        </ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
      </ItemContent>
      {value || action || (chevron && !destructive) ? (
        <ItemActions className="shrink-0">
          {value ? (
            // Same weight as ItemTitle, so the title still leads the row.
            <span className="text-sm font-medium text-muted-foreground">{value}</span>
          ) : null}
          {action}
          {chevron && !destructive ? (
            <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          ) : null}
        </ItemActions>
      ) : null}
    </>
  )

  return (
    // Rows after the first get 2px more on top for the separator, so the
    // pressed background keeps the same 4px all round on every row.
    <li className={cn("py-1 not-first:pt-1.5", settingsSeparatorClassName(Boolean(Icon || media)))}>
      {onClick ? (
        <Item asChild>
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
        <Item>{content}</Item>
      )}
    </li>
  )
}

export { SettingsGroup, SettingsRow, pressableRow }
