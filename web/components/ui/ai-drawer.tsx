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
 * shadcn's Drawer for the AI assistant: it drops from the top, keeps the
 * Drawer's size, and has its swipe handle on its lower edge, where the
 * thumb pushes it back up. The slide is longer and softer than vaul's
 * default (see `ai-drawer-content` in globals.css).
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
      className={cn("pt-[env(safe-area-inset-top,0px)]", className)}
      {...props}
    >
      {children}
      <div
        aria-hidden="true"
        className="mx-auto mt-1 mb-3 h-1 w-[100px] shrink-0 rounded-full bg-muted"
      />
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
