"use client"

import * as React from "react"
import { LoaderCircleIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/animate-ui/components/radix/dialog"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/animate-ui/components/radix/popover"
import { IconPicker } from "@/components/forms/icon-picker"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  categoryColorOptions,
  getCategoryColor,
  type CategoryColorName,
} from "@/lib/categories/category-colors"
import type {
  CategoryActionResult,
  CategoryFormValues,
} from "@/lib/categories/types"
import {
  categoryIconRegistry,
  type CategoryIconName,
} from "@/lib/icons/category-icon-registry"

type CategoryFormDialogProps = {
  deleteDescription?: React.ReactNode
  deleteLabel?: string
  description: React.ReactNode
  initialValues: CategoryFormValues
  nameLabel: string
  namePlaceholder?: string
  showColorPicker?: boolean
  onDelete?: () => Promise<CategoryActionResult>
  onSubmit: (values: CategoryFormValues) => Promise<CategoryActionResult>
  onSuccess?: () => void
  deleteSuccessMessage?: string
  submitLabel: string
  submitSuccessMessage: string
  title: React.ReactNode
  trigger: React.ReactNode
}

export function CategoryFormDialog({
  deleteDescription = "Hành động này không thể hoàn tác.",
  deleteLabel = "Xoá",
  description,
  initialValues,
  nameLabel,
  namePlaceholder,
  showColorPicker = true,
  onDelete,
  onSubmit,
  onSuccess,
  deleteSuccessMessage = "Đã xoá hạng mục.",
  submitLabel,
  submitSuccessMessage,
  title,
  trigger,
}: CategoryFormDialogProps) {
  const router = useRouter()
  const inputId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [name, setName] = React.useState(initialValues.name)
  const [color, setColor] = React.useState<CategoryColorName>(
    initialValues.colorName,
  )
  const [iconName, setIconName] = React.useState<CategoryIconName>(
    initialValues.iconName,
  )
  const SelectedIcon = categoryIconRegistry[iconName]
  const selectedColor = getCategoryColor(color)

  const resetForm = () => {
    setName(initialValues.name)
    setColor(initialValues.colorName)
    setIconName(initialValues.iconName)
    setErrorMessage(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) return
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  const finishAction = (
    result: CategoryActionResult,
    successMessage: string,
  ) => {
    if (!result.success) {
      setErrorMessage(result.error)
      toast.error(result.error)
      return
    }

    setOpen(false)
    toast.success(successMessage)
    onSuccess?.()
    router.refresh()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) return

    setErrorMessage(null)
    startTransition(async () => {
      try {
        finishAction(
          await onSubmit({
            name: trimmedName,
            colorName: color,
            iconName,
          }),
          submitSuccessMessage,
        )
      } catch {
        const message = "Không thể lưu thay đổi. Vui lòng thử lại."
        setErrorMessage(message)
        toast.error(message)
      }
    })
  }

  const handleDelete = () => {
    if (!onDelete) return

    setErrorMessage(null)
    startTransition(async () => {
      try {
        finishAction(await onDelete(), deleteSuccessMessage)
      } catch {
        const message = "Không thể xoá hạng mục. Vui lòng thử lại."
        setErrorMessage(message)
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 text-left">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${selectedColor.surfaceClassName}`}
            >
              <SelectedIcon className="size-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={inputId}>{nameLabel}</FieldLabel>
              <Input
                id={inputId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={namePlaceholder}
                maxLength={80}
                disabled={isPending}
              />
            </Field>

            {showColorPicker ? (
              <Field>
                <FieldLabel>Màu sắc</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={color}
                  onValueChange={(value) => {
                    if (value) setColor(value as CategoryColorName)
                  }}
                  className="flex-wrap"
                  disabled={isPending}
                >
                  {categoryColorOptions.map((option) => (
                    <ToggleGroupItem
                      key={option.name}
                      value={option.name}
                      aria-label={option.label}
                      className="aspect-square px-0"
                    >
                      <span
                        className={`size-3 rounded-full ${option.dotClassName}`}
                      />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            ) : null}

            <Field>
              <FieldLabel>Biểu tượng</FieldLabel>
              <IconPicker
                color={color}
                value={iconName}
                onValueChange={setIconName}
              />
            </Field>
          </FieldGroup>

          {errorMessage ? (
            <FieldError className="mt-4">{errorMessage}</FieldError>
          ) : null}

          <DialogFooter
            className={onDelete ? "mt-6 sm:justify-between" : "mt-6"}
          >
            {onDelete && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                  >
                    {deleteLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium">Xoá hạng mục?</p>
                      <p className="text-sm text-muted-foreground">
                        {deleteDescription}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <PopoverClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                        >
                          Huỷ
                        </Button>
                      </PopoverClose>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <LoaderCircleIcon className="animate-spin" />
                        ) : null}
                        Xác nhận xoá
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Huỷ
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!name.trim() || isPending}>
                {isPending ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : null}
                {isPending ? "Đang lưu..." : submitLabel}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
