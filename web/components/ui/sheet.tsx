"use client"

import * as React from "react"
import { cn } from "cn"
import { Dialog as SheetPrimitive } from "radix-ui"


import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      // Dim (no blur; see DrawerOverlay) on ::before so Safari 26 keeps the status bar's colour;
      // see DrawerOverlay.
      className={cn(
        "fixed inset-0 z-50 duration-100 before:absolute before:inset-0 before:bg-black/40 data-[state=closed]:pointer-events-none! data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

// Where a sheet comes from and how it is shaped:
// - screen: a whole screen pushed in from the right on phones, as a native
//   app opens a detail or form, on the page's grey; a 28rem panel from sm up.
// - bottom: a card rising from the bottom with rounded top corners and a
//   grabber, for short choices and confirmations; on the page's grey, so
//   the white groups of rows inside stand out.
// - default: shadcn's side panel, for the desktop sidebar.
const sheetContentClassName =
  "fixed z-50 flex flex-col bg-popover bg-clip-padding text-sm text-popover-foreground shadow-xl transition duration-200 ease-out data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=left]:sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=left]:data-open:slide-in-from-left-10 data-[side=right]:data-open:slide-in-from-right-10 data-[side=top]:data-open:slide-in-from-top-10 data-closed:animate-out data-closed:fade-out-0 data-[side=bottom]:data-closed:slide-out-to-bottom-10 data-[side=left]:data-closed:slide-out-to-left-10 data-[side=right]:data-closed:slide-out-to-right-10 data-[side=top]:data-closed:slide-out-to-top-10"

const sheetVariantClassName = {
  default: "data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:sm:max-w-sm data-[side=bottom]:border-t",
  screen:
    "gap-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] data-[side=right]:w-full data-[side=right]:sm:max-w-md data-[side=right]:sm:border-l",
  bottom:
    "max-h-[92dvh] rounded-t-[28px] pb-[env(safe-area-inset-bottom,0px)] data-[side=bottom]:mx-auto data-[side=bottom]:max-w-lg",
} as const

function SheetContent({
  className,
  children,
  side,
  variant = "default",
  surface,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  variant?: keyof typeof sheetVariantClassName
  /**
   * grouped: the page's grey, with white fields and groups of rows on it, so
   * the status bar above a sheet filling the phone keeps the page's colour.
   * plain: white, with grey fields. Screen and bottom sheets are grouped by
   * default.
   */
  surface?: "plain" | "grouped"
  showCloseButton?: boolean
}) {
  const resolvedSide = side ?? (variant === "bottom" ? "bottom" : "right")
  const resolvedSurface = surface ?? (variant === "default" ? "plain" : "grouped")

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={resolvedSide}
        data-variant={variant}
        data-surface={resolvedSurface}
        className={cn(
          sheetContentClassName,
          sheetVariantClassName[variant],
          resolvedSurface === "grouped" && "surface-grouped bg-background",
          className,
        )}
        {...props}
      >
        {variant === "bottom" ? (
          // The grabber: a cue that the sheet sits over the page.
          <span aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30" />
        ) : null}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="secondary"
              className="absolute top-4 right-4"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Đóng</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-6", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
