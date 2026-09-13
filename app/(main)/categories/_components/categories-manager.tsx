"use client"

import * as React from "react"
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/radix/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { categoryGroups } from "../_data/categories"
import type {
  CategoryGroup as CategoryGroupType,
  CategoryItem,
  CategoryType,
} from "../_types/category"
import { AddCategoryGroupDialog } from "./add-category-group-dialog"
import { CategoryGroup } from "./category-group"

const categorySections: Array<{
  type: CategoryType
  label: string
  icon: typeof ArrowUpRightIcon
}> = [
  {
    type: "expense",
    label: "Chi tiền",
    icon: ArrowUpRightIcon,
  },
  {
    type: "income",
    label: "Thu tiền",
    icon: ArrowDownLeftIcon,
  },
]

export function CategoriesManager() {
  const [activeType, setActiveType] = React.useState<CategoryType>("expense")
  const [groups, setGroups] = React.useState(categoryGroups)

  const addCategoryGroup = (group: CategoryGroupType) => {
    setGroups((currentGroups) => [...currentGroups, group])
  }

  const addCategoryItem = (groupId: string, item: CategoryItem) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? { ...group, items: [...group.items, item] }
          : group
      )
    )
  }

  const updateCategoryGroup = (
    groupId: string,
    updates: Pick<CategoryGroupType, "name" | "colorName" | "iconName">
  ) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    )
  }

  const updateCategoryItem = (
    groupId: string,
    itemId: string,
    updates: Pick<CategoryItem, "name" | "colorName" | "iconName">
  ) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : group
      )
    )
  }

  const deleteCategoryItem = (groupId: string, itemId: string) => {
    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.filter((item) => item.id !== itemId),
            }
          : group
      )
    )
  }

  return (
    <Tabs
      value={activeType}
      onValueChange={(value) => setActiveType(value as CategoryType)}
      className="gap-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full sm:w-fit">
          {categorySections.map(({ type, label, icon: Icon }) => (
            <TabsTrigger key={type} value={type}>
              <Icon />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <AddCategoryGroupDialog
          type={activeType}
          onAddGroup={addCategoryGroup}
        />
      </div>

      <TabsContents mode="layout">
        {categorySections.map(({ type }) => {
          const visibleGroups = groups.filter((group) => group.type === type)

          return (
            <TabsContent key={type} value={type} className="p-px">
              <Card>
                <CardContent>
                  {visibleGroups.map((group, index) => (
                    <div key={group.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <CategoryGroup
                        group={group}
                        onAddItem={(item) => addCategoryItem(group.id, item)}
                        onDeleteItem={(itemId) =>
                          deleteCategoryItem(group.id, itemId)
                        }
                        onUpdateGroup={(updates) =>
                          updateCategoryGroup(group.id, updates)
                        }
                        onUpdateItem={(itemId, updates) =>
                          updateCategoryItem(group.id, itemId, updates)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </TabsContents>
    </Tabs>
  )
}
