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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import type {
  CategoryGroup as CategoryGroupType,
  CategoryType,
} from "@/lib/categories/types"
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

type CategoriesManagerProps = {
  groups: CategoryGroupType[]
}

export function CategoriesManager({ groups }: CategoriesManagerProps) {
  const [activeType, setActiveType] = React.useState<CategoryType>("expense")

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
        <AddCategoryGroupDialog type={activeType} />
      </div>

      <TabsContents mode="layout">
        {categorySections.map(({ type }) => {
          const visibleGroups = groups.filter((group) => group.type === type)

          return (
            <TabsContent key={type} value={type} className="p-px">
              <Card>
                <CardContent>
                  {visibleGroups.length > 0 ? (
                    visibleGroups.map((group, index) => (
                      <div key={group.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <CategoryGroup group={group} />
                      </div>
                    ))
                  ) : (
                    <Empty className="py-12">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          {type === "expense" ? (
                            <ArrowUpRightIcon />
                          ) : (
                            <ArrowDownLeftIcon />
                          )}
                        </EmptyMedia>
                        <EmptyTitle>Chưa có nhóm hạng mục</EmptyTitle>
                        <EmptyDescription>
                          Tạo nhóm đầu tiên bằng nút phía trên để sắp xếp các
                          khoản {type === "expense" ? "chi" : "thu"}.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </TabsContents>
    </Tabs>
  )
}
