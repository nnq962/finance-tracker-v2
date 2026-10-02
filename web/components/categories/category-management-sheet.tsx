"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  LoaderCircleIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
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
  AlertDialogTrigger,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { IconPicker } from "@/components/forms/icon-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SheetNavHeader } from "@/components/sheet-nav-header"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TabsContent } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  createCategoryGroupNameAction,
  createCategoryItemAction,
  deleteCategoryGroupAction,
  deleteCategoryItemAction,
  updateCategoryGroupNameAction,
  updateCategoryItemAction,
} from "@/lib/categories/actions"
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
  showBackButton?: boolean
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
  showBackButton = false,
}: CategoryManagementSheetProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const [isPending, startTransition] = React.useTransition()
  const [activeType, setActiveType] = React.useState<CategoryType>(initialType)
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<
    Partial<Record<CategoryType, string>>
  >({})
  const [editor, setEditor] = React.useState<Editor | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState("")
  const [name, setName] = React.useState("")
  const [iconName, setIconName] = React.useState<CategoryIconName>("receipt")
  const [error, setError] = React.useState("")

  const editingGroup = editor?.groupId
    ? groups.find((group) => group.id === editor.groupId)
    : undefined
  const editingItem = editor?.kind === "item" && editor.itemId
    ? editingGroup?.items.find((item) => item.id === editor.itemId)
    : undefined

  function openGroupEditor(group?: CategoryGroup) {
    setActiveType(group?.type ?? activeType)
    setName(group?.name ?? "")
    setError("")
    setEditor({ kind: "group", groupId: group?.id })
  }

  function openItemEditor(group: CategoryGroup, item?: CategoryItem) {
    setActiveType(group.type)
    setName(item?.name ?? "")
    setIconName(item?.iconName ?? "receipt")
    setError("")
    setEditor({ kind: "item", groupId: group.id, itemId: item?.id })
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editor || isPending) return

    const nextName = name.trim()
    if (!nextName) {
      setError("Vui lòng nhập tên hạng mục.")
      return
    }

    setError("")
    startTransition(async () => {
      try {
        const result = editor.kind === "group"
          ? editor.groupId
            ? await updateCategoryGroupNameAction(editor.groupId, nextName)
            : await createCategoryGroupNameAction(activeType, nextName)
          : editor.itemId
            ? await updateCategoryItemAction(editor.itemId, { name: nextName, iconName })
            : await createCategoryItemAction(editor.groupId, { name: nextName, iconName })

        if (!result.success) {
          setError(result.error)
          toast.error(result.error)
          return
        }

        if (editor.kind === "group" && "id" in result) {
          setSelectedGroupIds((current) => ({ ...current, [activeType]: result.id }))
        }
        setEditor(null)
        toast.success("Đã lưu hạng mục.")
        router.refresh()
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

        if (currentEditor.kind === "group") {
          setSelectedGroupIds((current) => ({ ...current, [activeType]: undefined }))
        }
        setDeleteOpen(false)
        setEditor(null)
        toast.success("Đã xoá hạng mục.")
        router.refresh()
      } catch {
        const message = "Không thể xoá hạng mục. Vui lòng thử lại."
        setDeleteError(message)
        toast.error(message)
      }
    })
  }

  const editorTitle = editor?.kind === "group"
    ? `${editor.groupId ? "Sửa" : "Thêm"} nhóm ${activeType === "expense" ? "chi" : "thu"}`
    : `${editor?.itemId ? "Sửa" : "Thêm"} hạng mục`

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
        className="gap-0 data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetNavHeader
          title={editor ? editorTitle : "Quản lý hạng mục"}
          description={
            editor?.kind === "group"
              ? "Nhóm hạng mục chỉ cần một tên để sắp xếp các khoản thu, chi."
              : editor?.kind === "item"
                ? `Chọn icon và đặt tên trong nhóm “${editingGroup?.name ?? ""}”.`
                : "Chạm vào hạng mục để sửa hoặc thêm nhóm mới."
          }
          // In the editor, back returns to the list instead of closing.
          onBack={editor ? () => setEditor(null) : undefined}
          disabled={isPending}
        />

        {editor ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSave}>
            <div className="flex-1 overflow-y-auto px-4 pt-px pb-4">
              <FieldGroup>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="category-mock-name">
                    {editor.kind === "group" ? "Tên nhóm" : "Tên hạng mục"}
                  </FieldLabel>
                  <Input
                    id="category-mock-name"
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
                {editor.kind === "item" ? (
                  <Field>
                    <FieldLabel>Biểu tượng</FieldLabel>
                    <IconPicker color="blue" value={iconName} onValueChange={setIconName} />
                  </Field>
                ) : null}
              </FieldGroup>
              {editor.groupId && (editor.kind === "group" || editor.itemId) ? (
                <div className="mt-6">
                  <AlertDialog open={deleteOpen} onOpenChange={(nextOpen) => {
                    if (isPending) return
                    setDeleteOpen(nextOpen)
                    if (nextOpen) setDeleteError("")
                  }}>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" disabled={isPending}>
                        <Trash2Icon />
                        Xoá {editor.kind === "group" ? "nhóm" : "hạng mục"}
                      </Button>
                    </AlertDialogTrigger>
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
                </div>
              ) : null}
            </div>
            <SheetFooter>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" disabled={isPending} onClick={() => setEditor(null)}>
                  <ArrowLeftIcon />
                  Quay lại
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
                  {isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </SheetFooter>
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
              const selectedGroup = visibleGroups.find(
                (group) => group.id === selectedGroupIds[type],
              ) ?? visibleGroups[0]
              return (
                <TabsContent key={type} value={type} className="min-h-0 overflow-y-auto px-4 pt-px pb-4">
                  {selectedGroup ? (
                    <div className="space-y-5">
                      <div className="-mx-4 overflow-x-auto px-4 pb-2 pt-1">
                        <ToggleGroup
                          type="single"
                          value={selectedGroup.id}
                          onValueChange={(value) => {
                            if (value) setSelectedGroupIds((current) => ({
                              ...current,
                              [type]: value,
                            }))
                          }}
                          aria-label={`Nhóm hạng mục ${type === "expense" ? "chi" : "thu"}`}
                        >
                          {visibleGroups.map((group) => (
                            <ToggleGroupItem key={group.id} value={group.id}>
                              {group.name}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
                        <h2 className="min-w-0 truncate font-heading text-base font-extrabold">
                          {selectedGroup.name}
                        </h2>
                        <Button type="button" variant="ghost" onClick={() => openGroupEditor(selectedGroup)}>
                          Chỉnh sửa
                        </Button>
                        <p className="col-start-1 text-sm text-muted-foreground">
                          {selectedGroup.items.length} hạng mục
                        </p>
                      </div>

                      {selectedGroup.items.length ? (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedGroup.items.map((item) => {
                            const Icon = categoryIconRegistry[item.iconName]
                            return (
                              <Card key={item.id} size="sm" pressable asChild className="h-18 justify-center">
                                <button
                                  type="button"
                                  aria-label={`Sửa hạng mục ${item.name}`}
                                  onClick={() => openItemEditor(selectedGroup, item)}
                                >
                                  <CardContent className="flex items-center gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                                      <Icon className="size-5" />
                                    </span>
                                    <CardTitle className="min-w-0 line-clamp-2 text-left">
                                      {item.name}
                                    </CardTitle>
                                  </CardContent>
                                </button>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <Empty>
                          <EmptyHeader>
                            <EmptyTitle>Nhóm này chưa có hạng mục</EmptyTitle>
                            <EmptyDescription>Thêm hạng mục đầu tiên cho nhóm.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => openItemEditor(selectedGroup)}
                      >
                        <PlusIcon />
                        Thêm hạng mục
                      </Button>
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
              <div className="flex gap-2">
                {showBackButton ? (
                  <SheetClose asChild>
                    <Button type="button" variant="outline" className="flex-1">
                      <ArrowLeftIcon />
                      Quay lại
                    </Button>
                  </SheetClose>
                ) : null}
                <Button type="button" className="flex-1" onClick={() => openGroupEditor()}>
                  <PlusIcon />
                  Thêm nhóm {activeType === "expense" ? "chi" : "thu"}
                </Button>
              </div>
            </SheetFooter>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}
