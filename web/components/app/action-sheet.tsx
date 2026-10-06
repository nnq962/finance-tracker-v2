"use client"

import { CheckIcon } from "lucide-react"
import { Drawer as DrawerPrimitive } from "vaul"

import { DrawerOverlay, DrawerPortal } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

export type ActionSheetOption = { value: string; label: string; destructive?: boolean }

/**
 * iOS's action sheet: a short list of choices in a card over the bottom of
 * the screen, with Cancel apart below it. Dragged down or tapped outside, it
 * closes. For picking one of a few options (sort order) or a quick action.
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  options,
  value,
  onSelect,
  cancelLabel = "Huỷ",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  options: readonly ActionSheetOption[]
  /** The current choice, ticked. */
  value?: string
  onSelect: (value: string) => void
  cancelLabel?: string
}) {
  return (
    <DrawerPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md space-y-2 px-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] outline-none"
        >
          <div className="overflow-hidden rounded-3xl bg-popover text-popover-foreground">
            <DrawerPrimitive.Title className="py-3 text-center text-xs font-normal text-muted-foreground">
              {title}
            </DrawerPrimitive.Title>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value)
                  onOpenChange(false)
                }}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-2 border-t text-base transition-colors active:bg-muted",
                  option.destructive && "text-destructive",
                )}
              >
                {option.label}
                {option.value === value ? <CheckIcon strokeWidth={2.5} className="size-4" /> : null}
              </button>
            ))}
          </div>
          <DrawerPrimitive.Close className="h-14 w-full rounded-3xl bg-popover text-base font-medium text-popover-foreground transition-colors active:bg-muted">
            {cancelLabel}
          </DrawerPrimitive.Close>
        </DrawerPrimitive.Content>
      </DrawerPortal>
    </DrawerPrimitive.Root>
  )
}
