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
import type { CategoryColorName } from "@/lib/categories/category-colors"
import { cn } from "@/lib/utils"

/**
 * Divider above every row but the first, the full width of the list.
 * Exported for loading skeletons; `hasMedia` is kept for their calls.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function settingsSeparatorClassName(hasMedia?: boolean) {
  return "border-t first:border-t-0"
}

/**
 * Grouped list: an optional caption, a card of rows separated by dividers,
 * and an optional footnote.
 */
function SettingsGroup({
  title,
  action,
  header,
  footer,
  listClassName,
  size,
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
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      {title || action ? (
        <div className="flex min-h-6 items-center justify-between gap-3 px-4">
          {title ? (
            <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
              {title}
            </h2>
          ) : null}
          {action}
        </div>
      ) : null}
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
    </section>
  )
}

type SettingsRowProps = {
  icon?: LucideIcon
  /** Leading content in place of the icon, e.g. an avatar. */
  media?: React.ReactNode
  /** Kept for callers; the icon renders in the default colour. */
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

// Item only gives links a hover state; button rows get the same one, plus
// the selected state of the row whose screen is shown beside the list.
const pressableRow =
  "text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-50 md:data-[active=true]:bg-muted"

function SettingsRow({
  icon: Icon,
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
}: SettingsRowProps) {
  const content = (
    <>
      {Icon ? (
        <ItemMedia variant="icon">
          <Icon aria-hidden="true" />
        </ItemMedia>
      ) : media ? (
        <ItemMedia>{media}</ItemMedia>
      ) : null}
      <ItemContent className={cn("min-w-0", destructive && "items-center")}>
        <ItemTitle className={cn(destructive && "text-destructive")}>
          {title}
        </ItemTitle>
        {description ? <ItemDescription>{description}</ItemDescription> : null}
      </ItemContent>
      {value || action || (chevron && !destructive) ? (
        <ItemActions className="shrink-0">
          {value ? (
            <span className="text-sm text-muted-foreground">{value}</span>
          ) : null}
          {action}
          {chevron && !destructive ? (
            <ChevronRightIcon className="size-4" aria-hidden="true" />
          ) : null}
        </ItemActions>
      ) : null}
    </>
  )

  return (
    <li className={settingsSeparatorClassName()}>
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
