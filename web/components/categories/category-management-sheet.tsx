"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PlusIcon,
} from "lucide-react"
import { toast } from "sonner"

import { PageSheet, PageSheetFooter } from "@/components/app/page-sheet"
import { CategoryEditor, type CategoryValues } from "@/components/categories/category-editor"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { TabsContent } from "@/components/ui/tabs"
import {
  createCategoryGroupAction,
  createCategoryItemAction,
  deleteCategoryGroupAction,
  deleteCategoryItemAction,
  updateCategoryGroupAction,
  updateCategoryItemAction,
} from "@/lib/categories/actions"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup, CategoryItem, CategoryType } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

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

  const editingGroup = editor?.groupId
    ? groups.find((group) => group.id === editor.groupId)
    : undefined
  const editingItem = editor?.kind === "item" && editor.itemId
    ? editingGroup?.items.find((item) => item.id === editor.itemId)
    : undefined
  // Each editor opened starts from what it edits.
  const editorKey = editor ? `${editor.kind}-${editor.groupId ?? "new"}-${editor.kind === "item" ? editor.itemId ?? "new" : ""}` : ""

  // The list and the editor share the sheet's one scroller. The list
  // unmounts while an editor is open; its scroll position is kept here and
  // put back when the list returns, so it reopens where it was, while the
  // editor and a newly chosen tab start at the top.
  const contentRef = React.useRef<HTMLElement | null>(null)
  const savedScroll = React.useRef<number | null>(null)
  function getScroller() {
    return contentRef.current?.closest<HTMLElement>("[data-slot=page-sheet-body]") ?? null
  }
  function rememberScroll() {
    savedScroll.current = getScroller()?.scrollTop ?? 0
  }
  React.useLayoutEffect(() => {
    const scroller = getScroller()
    if (editor) {
      if (scroller) scroller.scrollTop = 0
      return
    }
    const saved = savedScroll.current
    if (saved === null) return
    savedScroll.current = null
    const restore = () => {
      const list = getScroller()
      if (list) list.scrollTop = saved
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
    setEditor({ kind: "group", groupId: group?.id })
  }

  function openItemEditor(group: CategoryGroup, item?: CategoryItem) {
    rememberScroll()
    setActiveType(group.type)
    setEditor({ kind: "item", groupId: group.id, itemId: item?.id })
  }

  function handleSave({ name, colorName, iconName }: CategoryValues) {
    return new Promise<string | null>((resolve) => {
      if (!editor) return resolve(null)
      const currentEditor = editor
      startTransition(async () => {
        try {
          const groupValues = { name, colorName, iconName }
          const result = currentEditor.kind === "group"
            ? currentEditor.groupId
              ? await updateCategoryGroupAction(currentEditor.groupId, groupValues)
              : await createCategoryGroupAction(activeType, groupValues)
            : currentEditor.itemId
              ? await updateCategoryItemAction(currentEditor.itemId, { name, iconName })
              : await createCategoryItemAction(currentEditor.groupId, { name, iconName })

          if (!result.success) {
            toast.error(result.error)
            return resolve(result.error)
          }

          setEditor(null)
          toast.success(currentEditor.kind === "group" ? "Đã lưu nhóm." : "Đã lưu hạng mục.")
          resolve(null)
        } catch {
          const message = "Không thể lưu thay đổi. Vui lòng thử lại."
          toast.error(message)
          resolve(message)
        }
      })
    })
  }

  function handleDelete() {
    if (!editor || isPending) return
    const currentEditor = editor
    startTransition(async () => {
      try {
        const result = currentEditor.kind === "group"
          ? await deleteCategoryGroupAction(currentEditor.groupId)
          : await deleteCategoryItemAction(currentEditor.itemId)

        if (!result.success) {
          toast.error(result.error)
          return
        }

        setEditor(null)
        toast.success(currentEditor.kind === "group" ? "Đã xoá nhóm." : "Đã xoá hạng mục.")
      } catch {
        toast.error("Không thể xoá. Vui lòng thử lại.")
      }
    })
  }

  const typeLabel = activeType === "expense" ? "chi" : "thu"
  const editorTitle = editor?.kind === "group"
    ? `${editor.groupId ? "Sửa" : "Thêm"} nhóm ${typeLabel}`
    : `${editor?.itemId ? "Sửa" : "Thêm"} hạng mục`

  return (
    <PageSheet
      title={editor ? editorTitle : "Quản lý hạng mục"}
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return
        if (controlledOpen === undefined) setInternalOpen(nextOpen)
        onOpenChange?.(nextOpen)
        if (!nextOpen) setEditor(null)
      }}
      trigger={triggerContent ? <Button type="button">{triggerContent}</Button> : undefined}
      // In the editor, back returns to the list instead of closing.
      onBack={editor ? () => setEditor(null) : undefined}
      disabled={isPending}
    >
      {editor ? (
        <div
          ref={(element) => {
            contentRef.current = element
          }}
          className="flex flex-1 flex-col"
        >
          <CategoryEditor
            key={editorKey}
            kind={editor.kind}
            type={activeType}
            group={editingGroup}
            item={editingItem}
            pending={isPending}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </div>
      ) : (
        <Tabs
          ref={(element) => {
            contentRef.current = element
          }}
          value={activeType}
          onValueChange={(value) => {
            setActiveType(value as CategoryType)
            // Each tab is its own list, read from the top.
            const scroller = getScroller()
            if (scroller) scroller.scrollTop = 0
          }}
          className="flex-1 gap-0"
        >
          <div className="pb-4">
            <TabsList className="w-full">
              {sections.map(({ type, label, icon: Icon }) => (
                <TabsTrigger key={type} value={type}>
                  <Icon />
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
                className="pb-4"
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
                              tone={group.colorName}
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
          <PageSheetFooter>
            <Button type="button" className="w-full" onClick={() => openGroupEditor()}>
              <PlusIcon />
              Thêm nhóm {typeLabel}
            </Button>
          </PageSheetFooter>
        </Tabs>
      )}
    </PageSheet>
  )
}
