"use client"

import * as React from "react"
import { cn } from "cn"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

/**
 * shadcn's Drawer for the AI assistant: it drops from the top and keeps the
 * Drawer's size on phones (a small floating panel from md). It still swipes
 * back up, without a handle in the way of the microphone's rings. The slide
 * is longer and softer than vaul's default (see `ai-drawer-content` in
 * globals.css).
 */
function AiDrawer({
  direction = "top",
  ...props
}: React.ComponentProps<typeof Drawer>) {
  return <Drawer data-slot="ai-drawer" direction={direction} {...props} />
}

function AiDrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerContent>) {
  return (
    <DrawerContent
      data-slot="ai-drawer-content"
      className={cn(
        "pt-[env(safe-area-inset-top,0px)]",
        // From md a small panel floating below the top edge, centred, in
        // place of the full-width drawer. Its top goes through the same
        // direction variant as the Drawer's top-0 to override it; vaul's
        // fill above the drawer (::after) would show in the gap.
        "md:mx-auto md:w-full md:max-w-md md:rounded-xl md:border md:pt-0 md:shadow-lg md:after:hidden md:data-[vaul-drawer-direction=top]:top-4",
        className,
      )}
      {...props}
    >
      {children}
    </DrawerContent>
  )
}

function AiDrawerHeader({ className, ...props }: React.ComponentProps<typeof DrawerHeader>) {
  return <DrawerHeader data-slot="ai-drawer-header" className={className} {...props} />
}

function AiDrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerTitle>) {
  return <DrawerTitle data-slot="ai-drawer-title" className={className} {...props} />
}

function AiDrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerDescription>) {
  return <DrawerDescription data-slot="ai-drawer-description" className={className} {...props} />
}

const AiDrawerClose = DrawerClose

export {
  AiDrawer,
  AiDrawerClose,
  AiDrawerContent,
  AiDrawerDescription,
  AiDrawerHeader,
  AiDrawerTitle,
}
