"use client"

import { LayoutGridIcon, ReceiptTextIcon, Settings2Icon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { FieldError } from "@/components/ui/field"
import type { CategoryGroup, CategoryItem } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

/** How many categories the grid shows before "Tất cả": two rows of four, the last cell being it. */
const GRID_COUNT = 7

/** A category no longer in the catalogue, kept by the transaction being edited. */
export type RetiredCategory = { id: string; name: string; groupName?: string }

/**
 * The categories to show first: the most used for this kind, then the
 * catalogue's order; the chosen one always among them, so it shows as chosen.
 */
export function gridCategories(items: CategoryItem[], usage: Map<string, number>, chosenId: string) {
  const ordered = [...items].sort((left, right) => (usage.get(right.id) ?? 0) - (usage.get(left.id) ?? 0))
  const shown = ordered.slice(0, GRID_COUNT)
  const chosen = ordered.find((item) => item.id === chosenId)
  if (chosen && !shown.includes(chosen)) shown[shown.length - 1] = chosen
  return shown
}

/**
 * The category as a grid of icons, as money apps pick it: the most used
 * first, the chosen one ringed, and "Tất cả" last for the whole list
 * (CategoryPicker). The chosen id is submitted as categoryId.
 */
export function CategoryGrid({
  id,
  items,
  retired,
  value,
  onValueChange,
  onShowAll,
  error,
}: {
  /** The first cell's id, for focusing the grid when no category is chosen. */
  id: string
  items: CategoryItem[]
  retired?: RetiredCategory
  value: string
  onValueChange: (id: string) => void
  onShowAll: () => void
  error?: string
}) {
  const cellClassName =
    "pressable flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
  const cells = [
    ...(retired ? [{ id: retired.id, name: retired.name, icon: ReceiptTextIcon, tone: undefined }] : []),
    ...items.map((item) => ({ id: item.id, name: item.name, icon: categoryIconRegistry[item.iconName], tone: item.colorName })),
  ]

  return (
    <section aria-labelledby={`${id}-caption`} className="flex flex-col gap-2">
      <h3 id={`${id}-caption`} className={cn("px-4", groupCaptionClassName, error && "text-destructive")}>
        Hạng mục
      </h3>
      <div
        className={cn("grid grid-cols-4 gap-1 rounded-[20px] bg-card p-2", error && "ring-2 ring-destructive/60")}
      >
        {cells.map((cell, index) => (
          <button
            key={cell.id}
            id={index === 0 ? id : undefined}
            type="button"
            aria-pressed={cell.id === value}
            onClick={() => onValueChange(cell.id)}
            className={cn(cellClassName, cell.id === value && "bg-muted ring-2 ring-foreground ring-inset")}
          >
            <IconTile icon={cell.icon} tone={cell.tone} />
            <span className="line-clamp-2 w-full text-xs leading-tight">{cell.name}</span>
          </button>
        ))}
        <button
          type="button"
          id={cells.length === 0 ? id : undefined}
          onClick={onShowAll}
          className={cellClassName}
        >
          <IconTile icon={LayoutGridIcon} />
          <span className="text-xs leading-tight">Tất cả</span>
        </button>
      </div>
      {error ? <FieldError className="px-4">{error}</FieldError> : null}
    </section>
  )
}

/**
 * Every category of the kind, by group, on a deeper screen of the sheet:
 * a tap picks one and goes back. Managing them is at the end.
 */
export function CategoryPicker({
  groups,
  retired,
  value,
  onPick,
  onManage,
}: {
  groups: CategoryGroup[]
  retired?: RetiredCategory
  value: string
  onPick: (id: string) => void
  onManage?: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {retired ? (
        <SettingsGroup title={retired.groupName ?? "Hạng mục đã ngừng sử dụng"}>
          <SettingsRow icon={ReceiptTextIcon} title={retired.name} checked={value === retired.id} onClick={() => onPick(retired.id)} />
        </SettingsGroup>
      ) : null}
      {groups.map((group) => (
        <SettingsGroup key={group.id} title={group.name}>
          {group.items.map((item) => (
            <SettingsRow
              key={item.id}
              icon={categoryIconRegistry[item.iconName]}
              tone={item.colorName}
              title={item.name}
              checked={value === item.id}
              onClick={() => onPick(item.id)}
            />
          ))}
        </SettingsGroup>
      ))}
      {onManage ? (
        <SettingsGroup>
          <SettingsRow icon={Settings2Icon} title="Quản lý hạng mục" onClick={onManage} />
        </SettingsGroup>
      ) : null}
    </div>
  )
}
