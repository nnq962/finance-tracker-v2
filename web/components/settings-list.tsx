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
 * Grouped list in the style of native settings screens: an optional caption,
 * a flat card of rows separated by dividers, and an optional footnote.
 */
function SettingsGroup({
  title,
  action,
  footer,
  children,
}: {
  title?: React.ReactNode
  /** Small control at the end of the caption, e.g. to edit the group. */
  action?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      {title || action ? (
        <div className="flex min-h-6 items-center justify-between gap-3 px-3">
          {title ? (
            <h2 className="flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {title}
            </h2>
          ) : null}
          {action}
        </div>
      ) : null}
      {/* Rows carry their own, equal padding, so the card only frames them:
          first and last rows match the ones in between. */}
      <Card size="sm" className="gap-0 py-0">
        <ul className="divide-y-2 divide-[#e7e4dd] px-1 dark:divide-[#35323e]">
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

// Item has no pressed state for button rows; these reuse the ghost/outline
// button colours (hover, pressed and selected).
const pressableRow =
  "text-left hover:bg-[#f3f1ec] active:bg-[#d6f4ff] disabled:pointer-events-none disabled:opacity-50 md:data-[active=true]:bg-[#d6f4ff] dark:hover:bg-[#2c2a33] dark:active:bg-[#113950] dark:md:data-[active=true]:bg-[#113950]"

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
          className={cn(destructive && "text-[#c8393a] dark:text-[#ff9b93]")}
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
    <li className="py-1">
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

export { SettingsGroup, SettingsRow }
