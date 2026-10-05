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
 * shadcn's Drawer for the AI assistant: it drops from the top, full width on
 * phones and centred at a phone's width from md. It swipes back up.
 */
function AiDrawer({
  direction = "top",
  // vaul resizes the drawer to the visual viewport while the keyboard is up,
  // which is meant for bottom drawers: a top one stretched down to the
  // keyboard and came back shorter than it opened. It stays as laid out.
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof Drawer>) {
  return <Drawer data-slot="ai-drawer" direction={direction} repositionInputs={repositionInputs} {...props} />
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
        // The Drawer's own padding, below the status bar.
        "pt-[calc(--spacing(4)+env(safe-area-inset-top,0px))]",
        "md:mx-auto md:w-full md:max-w-md",
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
