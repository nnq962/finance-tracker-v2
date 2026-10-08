"use client"

import { ReceiptTextIcon, Settings2Icon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { gridChoices, PickGrid } from "@/components/app/pick-grid"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import type { CategoryGroup, CategoryItem } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

/** A category no longer in the catalogue, kept by the transaction being edited. */
export type RetiredCategory = { id: string; name: string; groupName?: string }

/**
 * The categories to show first: the most used for this kind, then the
 * catalogue's order; the chosen one always among them, so it shows as chosen.
 * `taken`: cells used before these (a retired category), so the grid stays two rows.
 */
export function gridCategories(items: CategoryItem[], usage: Map<string, number>, chosenId: string, taken = 0) {
  const ordered = [...items].sort((left, right) => (usage.get(right.id) ?? 0) - (usage.get(left.id) ?? 0))
  return gridChoices(ordered, chosenId, taken)
}

/**
 * The category as a grid of icons (PickGrid): the most used first, the
 * chosen one ringed, and "Tất cả" last for the whole list (CategoryPicker).
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
  return (
    <PickGrid
      id={id}
      caption="Hạng mục"
      items={[
        ...(retired ? [{ id: retired.id, label: retired.name, media: <IconTile icon={ReceiptTextIcon} /> }] : []),
        ...items.map((item) => ({
          id: item.id,
          label: item.name,
          media: <IconTile icon={categoryIconRegistry[item.iconName]} tone={item.colorName} />,
        })),
      ]}
      value={value}
      onValueChange={onValueChange}
      onShowAll={onShowAll}
      error={error}
    />
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
