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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type {
  CategoryGroup as CategoryGroupType,
  CategoryType,
} from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { CategoriesHeader } from "./categories-header"
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
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<
    Partial<Record<CategoryType, string>>
  >({})

  return (
    <>
      <CategoriesHeader type={activeType} />
      <Tabs
        value={activeType}
        onValueChange={(value) => setActiveType(value as CategoryType)}
        className="gap-6"
      >
        <TabsList className="w-full sm:w-fit">
          {categorySections.map(({ type, label, icon: Icon }) => (
            <TabsTrigger key={type} value={type}>
              <Icon />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContents mode="layout">
          {categorySections.map(({ type }) => {
            const sectionGroups = groups.filter((group) => group.type === type)
            const sectionSelectedGroup =
              sectionGroups.find(
                (group) => group.id === selectedGroupIds[type],
              ) ??
              sectionGroups[0]

            return (
              <TabsContent key={type} value={type} className="p-px">
                {sectionGroups.length > 0 && sectionSelectedGroup ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.38fr)_minmax(0,1fr)]">
                    <Card className="lg:min-h-[32rem]">
                      <CardContent>
                        <ScrollArea className="h-[22rem] lg:h-[28rem]">
                          <nav
                            className="flex flex-col gap-1"
                            aria-label={`Nhóm hạng mục ${type === "expense" ? "chi" : "thu"}`}
                          >
                            {sectionGroups.map((group) => {
                              const GroupIcon =
                                categoryIconRegistry[group.iconName]
                              const groupColor = getCategoryColor(
                                group.colorName,
                              )
                              const isSelected =
                                group.id === sectionSelectedGroup.id

                              return (
                                <Button
                                  key={group.id}
                                  type="button"
                                  variant={isSelected ? "secondary" : "ghost"}
                                  size="lg"
                                  className="relative w-full justify-start"
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    setSelectedGroupIds((current) => ({
                                      ...current,
                                      [type]: group.id,
                                    }))
                                  }
                                >
                                  {isSelected ? (
                                    <span
                                      aria-hidden="true"
                                      className="absolute inset-y-0 left-0 w-1.5 overflow-hidden rounded-l-lg"
                                    >
                                      <span className="absolute inset-y-2 left-[-3px] w-1.5 rounded-full bg-primary" />
                                    </span>
                                  ) : null}
                                  <span
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-md ${groupColor.surfaceClassName}`}
                                  >
                                    <GroupIcon className="size-4" />
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-left">
                                    {group.name}
                                  </span>
                                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium tabular-nums text-foreground">
                                    {group.items.length}
                                  </span>
                                </Button>
                              )
                            })}
                          </nav>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <CategoryGroup group={sectionSelectedGroup} />
                  </div>
                ) : (
                  <Card>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )
          })}
        </TabsContents>
      </Tabs>
    </>
  )
}
