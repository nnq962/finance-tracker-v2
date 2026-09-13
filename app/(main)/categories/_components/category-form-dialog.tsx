"use client"

import * as React from "react"

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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  categoryColorOptions,
  getCategoryColor,
  type CategoryColorName,
} from "@/lib/categories/category-colors"
import {
  categoryIconRegistry,
  type CategoryIconName,
} from "@/lib/icons/category-icon-registry"

export type CategoryFormValues = {
  name: string
  colorName: CategoryColorName
  iconName: CategoryIconName
}

type CategoryFormDialogProps = {
  deleteDescription?: React.ReactNode
  deleteLabel?: string
  description: React.ReactNode
  initialValues: CategoryFormValues
  nameLabel: string
  namePlaceholder?: string
  onDelete?: () => void
  onSubmit: (values: CategoryFormValues) => void
  submitLabel: string
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
  onDelete,
  onSubmit,
  submitLabel,
  title,
  trigger,
}: CategoryFormDialogProps) {
  const inputId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(initialValues.name)
  const [color, setColor] = React.useState<CategoryColorName>(
    initialValues.colorName
  )
  const [iconName, setIconName] = React.useState<CategoryIconName>(
    initialValues.iconName
  )
  const SelectedIcon = categoryIconRegistry[iconName]
  const selectedColor = getCategoryColor(color)

  const resetForm = () => {
    setName(initialValues.name)
    setColor(initialValues.colorName)
    setIconName(initialValues.iconName)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) resetForm()
    setOpen(nextOpen)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) return

    onSubmit({
      name: trimmedName,
      colorName: color,
      iconName,
    })
    setOpen(false)
  }

  const handleDelete = () => {
    onDelete?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
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
                autoFocus
              />
            </Field>

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

            <Field>
              <FieldLabel>Biểu tượng</FieldLabel>
              <IconPicker
                color={color}
                value={iconName}
                onValueChange={setIconName}
              />
            </Field>
          </FieldGroup>

          <DialogFooter
            className={onDelete ? "mt-6 sm:justify-between" : "mt-6"}
          >
            {onDelete && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="destructive">
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
                        <Button type="button" variant="outline" size="sm">
                          Huỷ
                        </Button>
                      </PopoverClose>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                      >
                        Xác nhận xoá
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Huỷ
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!name.trim()}>
                {submitLabel}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
