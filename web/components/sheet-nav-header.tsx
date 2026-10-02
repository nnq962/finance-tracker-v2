"use client"

import type * as React from "react"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  SheetClose,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type SheetNavHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  /** Where the back button returns to, e.g. the screen that opened the sheet. */
  backLabel?: string
  /** Back within the sheet (e.g. from an editor to its list); closes it by default. */
  onBack?: () => void
  /** While saving, the sheet cannot be left. */
  disabled?: boolean
}

/**
 * Header shared by every sheet: a back button in place of the close icon,
 * then the title and description, like native navigation. Use with
 * `<SheetContent showCloseButton={false}>`.
 */
export function SheetNavHeader({
  title,
  description,
  backLabel = "Quay lại",
  onBack,
  disabled = false,
}: SheetNavHeaderProps) {
  const back = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 self-start"
      disabled={disabled}
      onClick={onBack}
    >
      <ChevronLeftIcon />
      {backLabel}
    </Button>
  )

  return (
    <SheetHeader>
      {onBack ? back : <SheetClose asChild>{back}</SheetClose>}
      <SheetTitle>{title}</SheetTitle>
      {description ? <SheetDescription>{description}</SheetDescription> : null}
    </SheetHeader>
  )
}
