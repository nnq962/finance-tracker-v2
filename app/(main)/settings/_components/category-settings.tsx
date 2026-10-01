"use client"

import * as React from "react"
import { SettingsIcon, TagsIcon } from "lucide-react"

import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import type { CategoryGroup, CategoryType } from "@/lib/categories/types"

function countItems(groups: CategoryGroup[], type: CategoryType) {
  return groups
    .filter((group) => group.type === type)
    .reduce((total, group) => total + group.items.length, 0)
}

export function CategorySettings({ groups }: { groups: CategoryGroup[] }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagsIcon className="size-4" />
          Hạng mục
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel>Hạng mục thu chi</FieldLabel>
            <FieldDescription>
              {countItems(groups, "expense")} hạng mục chi ·{" "}
              {countItems(groups, "income")} hạng mục thu
            </FieldDescription>
          </FieldContent>
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            <SettingsIcon />
            Quản lý hạng mục
          </Button>
        </Field>
      </CardContent>
      <CategoryManagementSheet
        groups={groups}
        open={open}
        onOpenChange={setOpen}
      />
    </Card>
  )
}
