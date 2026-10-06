"use client"

import type * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DrawerClose, DrawerTitle } from "@/components/ui/drawer"

/**
 * The top of a page sheet, as in iOS: a round close button on the left,
 * the title centred, and an optional action on the right.
 */
export function DrawerNavHeader({
  title,
  action,
  closeLabel = "Đóng",
}: {
  title: React.ReactNode
  /** A control on the right, e.g. a round Save button. */
  action?: React.ReactNode
  closeLabel?: string
}) {
  return (
    <div className="grid min-h-14 shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 px-4 pt-1 pb-2">
      <DrawerClose asChild>
        <Button type="button" variant="secondary" size="icon" aria-label={closeLabel}>
          <XIcon />
        </Button>
      </DrawerClose>
      <DrawerTitle className="truncate text-center text-[17px]">{title}</DrawerTitle>
      <div className="flex justify-end">{action}</div>
    </div>
  )
}
