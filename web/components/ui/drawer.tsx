"use client"

import * as React from "react"
import { cn } from "cn"
import { Drawer as DrawerPrimitive } from "vaul"


function Drawer({
  variant = "default",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * page: for DrawerContent variant="page". Nearly as tall as the screen, it
   * leaves the keyboard to the browser, which scrolls the focused field into
   * view as smoothly as in a Sheet; vaul's own repositioning and its styles
   * on <body> made the sheet jump while the keyboard opened. Scrolling
   * behind stays locked by the dialog underneath.
   */
  variant?: "default" | "page"
}) {
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      {...(variant === "page" ? { repositionInputs: false, noBodyStyles: true } : {})}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

// page: iOS's page sheet. It rises from the bottom to just below the status
// bar, white with rounded top corners and a grabber, over the dimmed page,
// and is dragged down to close. It never covers the status bar, so the
// status bar keeps the page's colour. The grabber floats over the content,
// which may scroll up to the sheet's top edge (PageSheet), clipped to its
// corners.
const pageSheetClassName =
  "fixed inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top,0px)+0.625rem)] z-50 flex flex-col overflow-hidden rounded-t-[28px] bg-popover pb-[env(safe-area-inset-bottom,0px)] text-sm text-popover-foreground shadow-xl outline-none sm:inset-x-auto sm:left-1/2 sm:top-[6dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2"

function DrawerContent({
  className,
  children,
  variant = "default",
  surface = "plain",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  variant?: "default" | "page"
  /** page only. grouped: the page's grey, for white groups of rows; plain: white, for forms. */
  surface?: "plain" | "grouped"
}) {
  if (variant === "page") {
    return (
      <DrawerPortal data-slot="drawer-portal">
        <DrawerOverlay />
        <DrawerPrimitive.Content
          data-slot="drawer-content"
          data-variant="page"
          data-surface={surface}
          className={cn(pageSheetClassName, surface === "grouped" && "surface-grouped bg-background", className)}
          {...props}
        >
          <span
            aria-hidden="true"
            className="absolute top-2 left-1/2 z-20 h-1 w-9 -translate-x-1/2 rounded-full bg-muted-foreground/30"
          />
          {children}
        </DrawerPrimitive.Content>
      </DrawerPortal>
    )
  }

  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-transparent p-4 text-sm before:absolute before:inset-2 before:-z-10 before:rounded-[28px] before:bg-popover before:shadow-xl data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-[32px] data-[vaul-drawer-direction=bottom]:bg-popover data-[vaul-drawer-direction=bottom]:p-0 data-[vaul-drawer-direction=bottom]:pb-[env(safe-area-inset-bottom,0px)] data-[vaul-drawer-direction=bottom]:shadow-xl data-[vaul-drawer-direction=bottom]:before:hidden data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-3 hidden h-1.5 w-10 shrink-0 rounded-full bg-input group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "font-heading text-base font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
