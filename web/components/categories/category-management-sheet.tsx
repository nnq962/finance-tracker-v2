"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { ColorPicker } from "@/components/forms/color-picker"
import { IconPicker } from "@/components/forms/icon-picker"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TabsContent } from "@/components/ui/tabs"
import {
  createCategoryGroupAction,
  createCategoryItemAction,
  deleteCategoryGroupAction,
  deleteCategoryItemAction,
  updateCategoryGroupAction,
  updateCategoryItemAction,
} from "@/lib/categories/actions"
import {
  getCategoryColor,
  type CategoryColorName,
} from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryItem, CategoryType } from "@/lib/categories/types"
import {
  categoryIconRegistry,
  type CategoryIconName,
} from "@/lib/icons/category-icon-registry"

type Editor =
  | { kind: "group"; groupId?: string }
  | { kind: "item"; groupId: string; itemId?: string }

type CategoryManagementSheetProps = {
  groups: CategoryGroup[]
  triggerContent?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialType?: CategoryType
}

const sections = [
  { type: "expense", label: "Chi tiền", icon: ArrowUpRightIcon },
  { type: "income", label: "Thu tiền", icon: ArrowDownLeftIcon },
] as const

const DEFAULT_COLOR: CategoryColorName = "blue"
const DEFAULT_ICON: CategoryIconName = "receipt"

export function CategoryManagementSheet({
  groups,
  triggerContent,
  open: controlledOpen,
  onOpenChange,
  initialType = "expense",
}: CategoryManagementSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const [isPending, startTransition] = React.useTransition()
  const [activeType, setActiveType] = React.useState<CategoryType>(initialType)
  const [editor, setEditor] = React.useState<Editor | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState("")
  const [name, setName] = React.useState("")
  const [iconName, setIconName] = React.useState<CategoryIconName>(DEFAULT_ICON)
  const [colorName, setColorName] = React.useState<CategoryColorName>(DEFAULT_COLOR)
  const [error, setError] = React.useState("")

  const editingGroup = editor?.groupId
    ? groups.find((group) => group.id === editor.groupId)
    : undefined
  const editingItem = editor?.kind === "item" && editor.itemId
    ? editingGroup?.items.find((item) => item.id === editor.itemId)
    : undefined

  // The list unmounts while an editor is open; its scroll position is kept
  // here and put back when the list returns, so it reopens where it was.
  const listRefs = React.useRef<Partial<Record<CategoryType, HTMLDivElement | null>>>({})
  const savedScroll = React.useRef<{ type: CategoryType; top: number } | null>(null)
  function rememberScroll() {
    savedScroll.current = { type: activeType, top: listRefs.current[activeType]?.scrollTop ?? 0 }
  }
  React.useLayoutEffect(() => {
    const saved = savedScroll.current
    if (editor || !saved) return
    savedScroll.current = null
    const restore = () => {
      const list = listRefs.current[saved.type]
      if (list) list.scrollTop = saved.top
    }
    restore()
    // Once more after the list has its full height (the tab content lays out
    // a frame later), which the first attempt may have been clamped to.
    const frame = requestAnimationFrame(restore)
    return () => cancelAnimationFrame(frame)
  }, [editor])

  function openGroupEditor(group?: CategoryGroup) {
    rememberScroll()
    setActiveType(group?.type ?? activeType)
    setName(group?.name ?? "")
    setColorName(group?.colorName ?? DEFAULT_COLOR)
    setIconName(group?.iconName ?? DEFAULT_ICON)
    setError("")
    setEditor({ kind: "group", groupId: group?.id })
  }

  function openItemEditor(group: CategoryGroup, item?: CategoryItem) {
    rememberScroll()
    setActiveType(group.type)
    setName(item?.name ?? "")
    // Items take their colour from the group.
    setColorName(group.colorName)
    setIconName(item?.iconName ?? DEFAULT_ICON)
    setError("")
    setEditor({ kind: "item", groupId: group.id, itemId: item?.id })
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor || isPending) return

    const nextName = name.trim()
    if (!nextName) {
      setError(editor.kind === "group" ? "Vui lòng nhập tên nhóm." : "Vui lòng nhập tên hạng mục.")
      return
    }

    setError("")
    startTransition(async () => {
      try {
        const groupValues = { name: nextName, colorName, iconName }
        const result = editor.kind === "group"
          ? editor.groupId
            ? await updateCategoryGroupAction(editor.groupId, groupValues)
            : await createCategoryGroupAction(activeType, groupValues)
          : editor.itemId
            ? await updateCategoryItemAction(editor.itemId, { name: nextName, iconName })
            : await createCategoryItemAction(editor.groupId, { name: nextName, iconName })

        if (!result.success) {
          setError(result.error)
          toast.error(result.error)
          return
        }

        setEditor(null)
        toast.success(editor.kind === "group" ? "Đã lưu nhóm." : "Đã lưu hạng mục.")
      } catch {
        const message = "Không thể lưu thay đổi. Vui lòng thử lại."
        setError(message)
        toast.error(message)
      }
    })
  }

  function handleDelete() {
    if (!editor || isPending) return
    const currentEditor = editor
    setDeleteError("")
    startTransition(async () => {
      try {
        const result = currentEditor.kind === "group"
          ? await deleteCategoryGroupAction(currentEditor.groupId)
          : await deleteCategoryItemAction(currentEditor.itemId)

        if (!result.success) {
          setDeleteError(result.error)
          toast.error(result.error)
          return
        }

        setDeleteOpen(false)
        setEditor(null)
        toast.success(currentEditor.kind === "group" ? "Đã xoá nhóm." : "Đã xoá hạng mục.")
      } catch {
        const message = "Không thể xoá. Vui lòng thử lại."
        setDeleteError(message)
        toast.error(message)
      }
    })
  }

  const typeLabel = activeType === "expense" ? "chi" : "thu"
  const editorTitle = editor?.kind === "group"
    ? `${editor.groupId ? "Sửa" : "Thêm"} nhóm ${typeLabel}`
    : `${editor?.itemId ? "Sửa" : "Thêm"} hạng mục`
  const canDelete = editor?.kind === "group" ? Boolean(editor.groupId) : Boolean(editor?.itemId)

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (isPending) return
      if (controlledOpen === undefined) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
      if (!nextOpen) setEditor(null)
    }}>
      {triggerContent ? (
        <SheetTrigger asChild>
          <Button type="button">{triggerContent}</Button>
        </SheetTrigger>
      ) : null}
      <SheetContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetNavHeader
          title={editor ? editorTitle : "Quản lý hạng mục"}
          // In the editor, back returns to the list instead of closing.
          onBack={editor ? () => setEditor(null) : undefined}
          disabled={isPending}
        />

        {editor ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSave}>
            <div className="flex-1 space-y-6 overflow-y-auto px-4 pt-px pb-4">
              <FieldGroup>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="category-name">
                    {editor.kind === "group" ? "Tên nhóm" : "Tên hạng mục"}
                  </FieldLabel>
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setError("")
                    }}
                    maxLength={80}
                    disabled={isPending}
                    placeholder={editor.kind === "group" ? "Ví dụ: Ăn uống" : "Ví dụ: Ăn sáng"}
                    aria-invalid={Boolean(error)}
                  />
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
                {editor.kind === "group" ? (
                  <Field>
                    <FieldLabel>Màu</FieldLabel>
                    <ColorPicker value={colorName} onValueChange={setColorName} />
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel>Biểu tượng</FieldLabel>
                  <IconPicker color={colorName} value={iconName} onValueChange={setIconName} />
                </Field>
              </FieldGroup>

              {canDelete ? (
                <SettingsGroup>
                  <SettingsRow
                    destructive
                    title={editor.kind === "group" ? "Xoá nhóm" : "Xoá hạng mục"}
                    disabled={isPending}
                    onClick={() => {
                      setDeleteError("")
                      setDeleteOpen(true)
                    }}
                  />
                </SettingsGroup>
              ) : null}
            </div>
            <SheetFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
                {isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </SheetFooter>

            <AlertDialog open={deleteOpen} onOpenChange={(nextOpen) => {
              if (!isPending) setDeleteOpen(nextOpen)
            }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Xoá {editor.kind === "group" ? "nhóm" : "hạng mục"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {editor.kind === "group"
                      ? `Nhóm “${editingGroup?.name ?? ""}” cùng ${editingGroup?.items.length ?? 0} hạng mục bên trong sẽ bị xoá. Các giao dịch cũ vẫn được giữ lại.`
                      : `Hạng mục “${editingItem?.name ?? ""}” sẽ bị xoá. Các giao dịch cũ vẫn được giữ lại.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError ? <FieldError>{deleteError}</FieldError> : null}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
                  <AlertDialogAction
                    type="button"
                    disabled={isPending}
                    onClick={(event) => {
                      event.preventDefault()
                      handleDelete()
                    }}
                  >
                    {isPending ? <LoaderCircleIcon className="animate-spin" /> : <Trash2Icon />}
                    {isPending ? "Đang xoá..." : "Xoá"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        ) : (
          <Tabs
            value={activeType}
            onValueChange={(value) => setActiveType(value as CategoryType)}
            className="min-h-0 flex-1 gap-0"
          >
            <div className="px-4 pb-4">
              <TabsList className="w-full">
                {sections.map(({ type, label, icon: Icon }) => (
                  <TabsTrigger key={type} value={type}>
                    <Icon className="size-3" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {sections.map(({ type }) => {
              const visibleGroups = groups.filter((group) => group.type === type)
              return (
                <TabsContent
                  key={type}
                  value={type}
                  ref={(element) => {
                    listRefs.current[type] = element
                  }}
                  className="min-h-0 overflow-y-auto px-4 pt-px pb-4"
                >
                  {visibleGroups.length ? (
                    // Every group at once, so all categories are one scroll away.
                    <div className="space-y-6">
                      {visibleGroups.map((group) => {
                        const GroupIcon = categoryIconRegistry[group.iconName]
                        return (
                          <SettingsGroup
                            key={group.id}
                            title={
                              <>
                                <GroupIcon
                                  className={`size-3.5 shrink-0 ${getCategoryColor(group.colorName).iconClassName}`}
                                  aria-hidden="true"
                                />
                                <span className="truncate">{group.name}</span>
                              </>
                            }
                            action={
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                aria-label={`Sửa nhóm ${group.name}`}
                                onClick={() => openGroupEditor(group)}
                              >
                                Sửa
                              </Button>
                            }
                          >
                            {group.items.map((item) => (
                              <SettingsRow
                                key={item.id}
                                icon={categoryIconRegistry[item.iconName]}
                                color={group.colorName}
                                title={item.name}
                                onClick={() => openItemEditor(group, item)}
                              />
                            ))}
                            <SettingsRow
                              icon={PlusIcon}
                              title="Thêm hạng mục"
                              chevron={false}
                              onClick={() => openItemEditor(group)}
                            />
                          </SettingsGroup>
                        )
                      })}
                    </div>
                  ) : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>Chưa có nhóm hạng mục</EmptyTitle>
                        <EmptyDescription>Thêm nhóm để bắt đầu sắp xếp các hạng mục.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </TabsContent>
              )
            })}
            <SheetFooter>
              <Button type="button" className="w-full" onClick={() => openGroupEditor()}>
                <PlusIcon />
                Thêm nhóm {typeLabel}
              </Button>
            </SheetFooter>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}
