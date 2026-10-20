"use client"

import * as React from "react"
import { cn } from "cn"
import { Drawer as DrawerPrimitive } from "vaul"

import { useIsMobile } from "@/hooks/use-mobile"


function Drawer({
  variant = "default",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  /**
   * page: for DrawerContent variant="page". Nearly as tall as the screen; its
   * styles on <body> made the sheet jump while the keyboard opened, so they
   * are off and scrolling behind stays locked by the dialog underneath. On
   * desktop it slides in from the right instead (2026-10-18), and is not
   * dragged: a mouse drag there selects text, as on any desktop panel.
   */
  variant?: "default" | "page"
}) {
  const isMobile = useIsMobile()
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      // Every drawer leaves the keyboard to the browser, which scrolls the
      // focused field into view. vaul's repositioning set a fixed height on
      // the sheet while the keyboard was up and, once it closed, put back the
      // height measured before: content added meanwhile (a coupon taken at
      // checkout) was cut off at the bottom, the pay button with it.
      repositionInputs={false}
      {...(variant === "page" ? { noBodyStyles: true, ...(isMobile ? {} : { direction: "right" as const, handleOnly: true }) } : {})}
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
      // A plain dim, as shadcn's drawer, no blur: a backdrop blur under a layer
      // fading in only shows once the fade ends, so the page dimmed and then
      // went blurry. Closing, it lets taps through: while it faded out it took
      // a tap meant for the sheet below as one outside it, which closed that
      // sheet too (Xoá → Huỷ → Xoá again on an account); important, over the
      // inline pointer-events Radix puts on it. The dim is on ::before, not on this fixed layer: Safari 26
      // tints the status bar from the background and backdrop-filter of a
      // fixed element at the screen's top edge (theme-color is ignored), and
      // took the veil's, so the bar turned white under every overlay. It
      // skips pseudo-elements.
      className={cn(
        "fixed inset-0 z-50 before:absolute before:inset-0 before:bg-black/40 data-[state=closed]:pointer-events-none! data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

// page: a full-screen sheet on phones. It rises from the bottom over the
// dimmed page and covers the whole screen, the status bar too, and is dragged
// down to close. Safari 26 tints the status bar from a fixed element at the
// screen's top edge, so once the sheet is up the bar takes the sheet's colour
// (white, as the page, so the bar does not change). From 640px,
// a panel with rounded top corners, below the top. The grabber
// floats over the content, which may scroll up to the sheet's top edge
// (PageSheet). Clipped rather than hidden where it can be: a hidden box can
// still be scrolled from code (a focus or scrollIntoView reaching for
// something under the footer), which slid the whole sheet, bar and all, up
// out of view.
// Desktop (from 768px, where the sidebar shows; 2026-10-18): a panel
// floating at the right, 12px off the window's edges, rounded all round,
// sliding in from the right over a lighter dim, as desktop apps do.
// will-change-auto: vaul keeps will-change: transform on every drawer, which
// may keep Safari from taking the sheet's colour for the status bar.
const pageSheetClassName =
  "fixed will-change-auto! inset-x-0 bottom-0 top-0 z-50 flex flex-col overflow-hidden supports-[overflow:clip]:overflow-clip bg-popover pt-[env(safe-area-inset-top,0px)] text-sm text-popover-foreground shadow-xl outline-none sm:inset-x-auto sm:left-1/2 sm:top-[6dvh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:rounded-t-[28px] sm:pt-0 md:inset-x-auto md:top-3 md:right-3 md:bottom-3 md:left-auto md:w-110 md:max-w-[calc(100vw-1.5rem)] md:translate-x-0 md:rounded-[24px] md:shadow-[0_0_0_0.5px_color-mix(in_oklab,var(--foreground)_8%,transparent),0_24px_64px_-16px_rgb(0_0_0/0.35)] md:[--initial-transform:calc(100%+2.75rem)]"

/**
 * A tap on a toast (its Undo, or swiping it away) is not a tap outside the
 * sheet: the sheet stays open, the debt's sheet after undoing a deleted
 * repayment among them (2026-10-17).
 */
type InteractOutside = React.ComponentProps<typeof DrawerPrimitive.Content>["onInteractOutside"]

function keepOpenForToasts(onInteractOutside: InteractOutside): InteractOutside {
  return (event) => {
    if (event.target instanceof Element && event.target.closest("[data-sonner-toaster]")) event.preventDefault()
    onInteractOutside?.(event)
  }
}

function DrawerContent({
  className,
  children,
  variant = "default",
  surface = "plain",
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  variant?: "default" | "page"
  /**
   * grouped: the sheet ground (white in light, as the page, since 2026-10-21),
   * its groups of rows lifted cards and its fields light grey, as every sheet
   * in the app (a short bottom sheet such as the month picker too);
   * plain: white, for a page sheet that is one bare form.
   */
  surface?: "plain" | "grouped"
}) {
  if (variant === "page") {
    return (
      <DrawerPortal data-slot="drawer-portal">
        {/* The whole screen, status bar band too (2026-10-21): page and sheet
            are both white now, so the band once left undimmed to keep the
            bar's colour (Safari 26) is gone. */}
        <DrawerOverlay className="md:before:bg-black/20" />
        <DrawerPrimitive.Content
          data-slot="drawer-content"
          data-variant="page"
          data-surface={surface}
          className={cn(pageSheetClassName, surface === "grouped" && "surface-sheet bg-background", className)}
          {...props}
          onInteractOutside={keepOpenForToasts(onInteractOutside)}
        >
          <span
            aria-hidden="true"
            className="absolute top-[calc(env(safe-area-inset-top,0px)+0.5rem)] left-1/2 z-20 h-1 w-9 sm:top-2 md:hidden -translate-x-1/2 rounded-full bg-muted-foreground/30"
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
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-transparent p-4 text-sm before:absolute before:inset-2 before:-z-10 before:rounded-[28px] before:bg-popover before:shadow-xl data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:sm:inset-x-auto data-[vaul-drawer-direction=bottom]:sm:left-1/2 data-[vaul-drawer-direction=bottom]:sm:w-full data-[vaul-drawer-direction=bottom]:sm:max-w-lg data-[vaul-drawer-direction=bottom]:sm:-translate-x-1/2 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-[32px] data-[vaul-drawer-direction=bottom]:bg-popover data-[vaul-drawer-direction=bottom]:p-0 data-[vaul-drawer-direction=bottom]:pb-[env(safe-area-inset-bottom,0px)] data-[vaul-drawer-direction=bottom]:shadow-xl data-[vaul-drawer-direction=bottom]:before:hidden data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          // After the base, so the sheet ground wins over the popover.
          surface === "grouped" && "surface-sheet data-[vaul-drawer-direction=bottom]:bg-background",
          className
        )}
        {...props}
        onInteractOutside={keepOpenForToasts(onInteractOutside)}
      >
        <div className="mx-auto mt-3 hidden h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30 group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {/* Content taller than the sheet's cap scrolls rather than being cut
            off (vaul tells a scroll from a drag to close). Inside, not on the
            sheet: vaul's ::after, which fills the gap under a sheet dragged up,
            would scroll too. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">{children}</div>
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
