"use client"

import type * as React from "react"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type SheetNavHeaderProps = {
  title: React.ReactNode
  /** Names the back button for screen readers, e.g. the screen it returns to. */
  backLabel?: string
  /** Back within the sheet (e.g. from an editor to its list); closes it by default. */
  onBack?: () => void
  /** While saving, the sheet cannot be left. */
  disabled?: boolean
}

/**
 * Header shared by every sheet, like a native navigation bar: an icon back
 * button on the left and the title centred. There is no description, so use
 * with `<SheetContent showCloseButton={false} aria-describedby={undefined}>`.
 */
export function SheetNavHeader({
  title,
  backLabel = "Quay lại",
  onBack,
  disabled = false,
}: SheetNavHeaderProps) {
  const back = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={backLabel}
      disabled={disabled}
      onClick={onBack}
    >
      <ChevronLeftIcon />
    </Button>
  )

  return (
    <SheetHeader className="relative min-h-14 justify-center px-4 py-2">
      <div className="absolute top-1/2 left-2 -translate-y-1/2">
        {onBack ? back : <SheetClose asChild>{back}</SheetClose>}
      </div>
      {/* Side padding clears the back button so the title stays centred. */}
      <SheetTitle className="truncate px-8 text-center">{title}</SheetTitle>
    </SheetHeader>
  )
}
