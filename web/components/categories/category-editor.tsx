"use client"

import * as React from "react"
import { SaveIcon, Trash2Icon } from "lucide-react"

import { ActionSheet } from "@/components/app/action-sheet"
import { IconTile } from "@/components/app/icon-tile"
import { PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { ColorPicker } from "@/components/forms/color-picker"
import { IconPicker, IconPickerScreen } from "@/components/forms/icon-picker"
import { InlineInput } from "@/components/forms/inline-input"
import { groupCaptionClassName, SettingsFieldRow, SettingsGroup } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryItem, CategoryType } from "@/lib/categories/types"
import { categoryIconRegistry, type CategoryIconName } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

export type CategoryValues = { name: string; colorName: CategoryColorName; iconName: CategoryIconName }

const DEFAULT_COLOR: CategoryColorName = "blue"
const DEFAULT_ICON: CategoryIconName = "receipt"

function Caption({ children }: { children: React.ReactNode }) {
  return <h3 className={cn("px-4", groupCaptionClassName)}>{children}</h3>
}

/**
 * Adding or editing a group of categories (name, colour, icon) or a category
 * in a group (name and icon; its colour is the group's), as the app's other
 * forms: the tile it will have, large at the top with its name, following
 * what is chosen; the name typed in place; the colours; the icons as a grid
 * of two rows (the chosen one, those matching the name, the group's), the
 * last cell opening every icon on a deeper screen with a search. Saving at
 * the foot, deleting beside it, asked again in an action sheet since a
 * group goes with its categories (past transactions stay).
 */
export function CategoryEditor({
  kind,
  type,
  group,
  item,
  pending,
  onSave,
  onDelete,
}: {
  kind: "group" | "item"
  type: CategoryType
  /** The group edited, or the one the category is (or will be) in. */
  group?: CategoryGroup
  /** The category edited; none adds one. */
  item?: CategoryItem
  pending: boolean
  /** Saves, then resolves with an error to show, or null. */
  onSave: (values: CategoryValues) => Promise<string | null>
  onDelete: () => void
}) {
  const editing = kind === "group" ? group : item
  const [name, setName] = React.useState(editing?.name ?? "")
  const [colorName, setColorName] = React.useState<CategoryColorName>(group?.colorName ?? DEFAULT_COLOR)
  const [iconName, setIconName] = React.useState<CategoryIconName>(editing?.iconName ?? DEFAULT_ICON)
  const [error, setError] = React.useState("")
  const [allIcons, setAllIcons] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  usePageSheetScreen(allIcons ? { title: "Biểu tượng", onBack: () => setAllIcons(false) } : null)

  const noun = kind === "group" ? "nhóm" : "hạng mục"
  const itemCount = group?.items.length ?? 0
  const caption = kind === "group"
    ? editing
      ? `${itemCount} hạng mục`
      : `Nhóm ${type === "expense" ? "chi" : "thu"}`
    : `Trong nhóm ${group?.name ?? ""}`
  // The group's icon and its categories' as the next suggestions.
  const fallback = group ? [group.iconName, ...group.items.map((category) => category.iconName)] : []

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const nextName = name.trim()
    if (!nextName) {
      setError(kind === "group" ? "Nhập tên nhóm." : "Nhập tên hạng mục.")
      return
    }
    setError((await onSave({ name: nextName, colorName, iconName })) ?? "")
  }

  return (
    <>
      {allIcons ? (
        <IconPickerScreen
          value={iconName}
          color={colorName}
          onPick={(icon) => {
            setIconName(icon)
            setAllIcons(false)
          }}
        />
      ) : null}
      {/* Hidden, not removed, under every icon: the grid keeps its order. */}
      <form hidden={allIcons} className="flex flex-1 flex-col" onSubmit={submit}>
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-6 pb-4">
          {/* What it will look like, following each choice. */}
          <div className="flex flex-col items-center gap-1 pt-2 text-center">
            <IconTile icon={categoryIconRegistry[iconName]} tone={colorName} size="lg" />
            <p className={cn("mt-2 max-w-full truncate text-base font-semibold", !name.trim() && "text-muted-foreground")}>
              {name.trim() || (kind === "group" ? "Tên nhóm" : "Tên hạng mục")}
            </p>
            <p className="text-xs text-muted-foreground">{caption}</p>
          </div>

          <div className="flex flex-col gap-2">
            <SettingsGroup>
              <SettingsFieldRow htmlFor="category-name" title="Tên" invalid={Boolean(error)}>
                <InlineInput
                  id="category-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError("")
                  }}
                  placeholder={kind === "group" ? "Ăn uống" : "Cà phê"}
                  maxLength={80}
                  aria-invalid={Boolean(error) || undefined}
                />
              </SettingsFieldRow>
            </SettingsGroup>
            {error ? <FieldError className="px-4">{error}</FieldError> : null}
          </div>

          {kind === "group" ? (
            <section className="flex flex-col gap-2">
              <Caption>Màu</Caption>
              <ColorPicker value={colorName} onValueChange={setColorName} />
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <Caption>Biểu tượng</Caption>
            <IconPicker
              value={iconName}
              color={colorName}
              name={name}
              fallback={fallback}
              onValueChange={setIconName}
              onShowAll={() => setAllIcons(true)}
            />
            <p className="px-4 text-xs text-muted-foreground">Gợi ý theo tên. Ô cuối mở tất cả biểu tượng.</p>
          </section>
        </fieldset>

        <PageSheetFooter>
          {/* Deleting beside saving, as tall as it; asked again before it goes. */}
          <div className="flex items-center gap-2">
            {editing ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                aria-label={`Xoá ${noun}`}
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2Icon />
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? <Spinner /> : <SaveIcon />}
              {pending ? "Đang lưu…" : editing ? "Lưu thay đổi" : kind === "group" ? "Thêm nhóm" : "Thêm hạng mục"}
            </Button>
          </div>
        </PageSheetFooter>

        <ActionSheet
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={
            kind === "group"
              ? `Xoá nhóm “${group?.name ?? ""}”${itemCount ? ` và ${itemCount} hạng mục bên trong` : ""}? Giao dịch cũ vẫn được giữ.`
              : `Xoá hạng mục “${item?.name ?? ""}”? Giao dịch cũ vẫn được giữ.`
          }
          options={[{ value: "delete", label: `Xoá ${noun}`, destructive: true }]}
          onSelect={onDelete}
        />
      </form>
    </>
  )
}
