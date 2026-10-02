"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  AiDrawer,
  AiDrawerContent,
  AiDrawerDescription,
  AiDrawerHeader,
  AiDrawerTitle,
} from "@/components/ui/ai-drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const tags = Array.from({ length: 50 }, (_, index) => `v1.2.0-beta.${50 - index}`)

function TagList() {
  return (
    <div className="p-4">
      <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
      {tags.map((tag) => (
        <React.Fragment key={tag}>
          <div className="text-sm">{tag}</div>
          <Separator className="my-2" />
        </React.Fragment>
      ))}
    </div>
  )
}

/**
 * The scroll area in this settings sheet, in the AI drawer, and native
 * scrolling in the drawer, to compare how their scrollbars keep up.
 */
export function ScrollLab() {
  const [open, setOpen] = React.useState<"scroll-area" | "native" | null>(null)

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="grid content-start gap-1.5">
        <p className="text-sm font-semibold">ScrollArea trong sheet này</p>
        <ScrollArea className="h-72 w-48 rounded-md border">
          <TagList />
        </ScrollArea>
      </div>

      <div className="grid content-start gap-2">
        <p className="text-sm font-semibold">Trong drawer AI</p>
        <Button type="button" variant="outline" onClick={() => setOpen("scroll-area")}>
          ScrollArea trong drawer
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen("native")}>
          Cuộn gốc trong drawer
        </Button>
      </div>

      <AiDrawer open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <AiDrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <AiDrawerHeader>
              <AiDrawerTitle>{open === "native" ? "Cuộn gốc" : "ScrollArea"}</AiDrawerTitle>
              <AiDrawerDescription>Vuốt danh sách để so sánh.</AiDrawerDescription>
            </AiDrawerHeader>
            <div className="px-4 pb-4">
              {open === "native" ? (
                <div
                  data-vaul-no-drag
                  className="h-72 overflow-y-auto rounded-md border [scrollbar-width:auto] [&::-webkit-scrollbar]:w-auto"
                >
                  <TagList />
                </div>
              ) : (
                <ScrollArea data-vaul-no-drag className="h-72 rounded-md border">
                  <TagList />
                </ScrollArea>
              )}
            </div>
          </div>
        </AiDrawerContent>
      </AiDrawer>
    </div>
  )
}
