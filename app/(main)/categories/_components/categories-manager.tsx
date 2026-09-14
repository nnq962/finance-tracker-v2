"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
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

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/đ/g, "d")
}

export function CategoriesManager({ groups }: CategoriesManagerProps) {
  const [activeType, setActiveType] = React.useState<CategoryType>("expense")
  const [searchQuery, setSearchQuery] = React.useState("")
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-fit">
            {categorySections.map(({ type, label, icon: Icon }) => (
              <TabsTrigger key={type} value={type}>
                <Icon />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <InputGroup className="w-full bg-white sm:w-72 dark:bg-input/30">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm kiếm hạng mục..."
              aria-label="Tìm kiếm hạng mục"
            />
            {searchQuery ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  onClick={() => setSearchQuery("")}
                  aria-label="Xoá nội dung tìm kiếm"
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>

        <TabsContents mode="layout">
          {categorySections.map(({ type }) => {
            const sectionGroups = groups.filter((group) => group.type === type)
            const normalizedQuery = normalizeSearchValue(searchQuery.trim())
            const searchResults = sectionGroups.flatMap((group) => {
              if (!normalizedQuery) {
                return [{ group, items: group.items }]
              }

              if (normalizeSearchValue(group.name).includes(normalizedQuery)) {
                return [{ group, items: group.items }]
              }

              const matchingItems = group.items.filter((item) =>
                normalizeSearchValue(item.name).includes(normalizedQuery),
              )

              return matchingItems.length > 0
                ? [{ group, items: matchingItems }]
                : []
            })
            const selectedResult =
              searchResults.find(
                ({ group }) => group.id === selectedGroupIds[type],
              ) ?? searchResults[0]

            return (
              <TabsContent key={type} value={type} className="p-px">
                {selectedResult ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.38fr)_minmax(0,1fr)]">
                    <Card>
                      <CardContent>
                        <ScrollArea className="max-h-[28rem]">
                          <nav
                            className="flex flex-col gap-1"
                            aria-label={`Nhóm hạng mục ${type === "expense" ? "chi" : "thu"}`}
                          >
                            {searchResults.map(({ group, items }) => {
                              const GroupIcon =
                                categoryIconRegistry[group.iconName]
                              const groupColor = getCategoryColor(
                                group.colorName,
                              )
                              const isSelected =
                                group.id === selectedResult.group.id

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
                                    {items.length}
                                  </span>
                                </Button>
                              )
                            })}
                          </nav>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <CategoryGroup
                      group={selectedResult.group}
                      items={selectedResult.items}
                    />
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
                          <EmptyTitle>
                            {sectionGroups.length > 0
                              ? "Không tìm thấy hạng mục"
                              : "Chưa có nhóm hạng mục"}
                          </EmptyTitle>
                          <EmptyDescription>
                            {sectionGroups.length > 0
                              ? `Không có kết quả phù hợp với “${searchQuery.trim()}”.`
                              : `Tạo nhóm đầu tiên bằng nút phía trên để sắp xếp các khoản ${type === "expense" ? "chi" : "thu"}.`}
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
