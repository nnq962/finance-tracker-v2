"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "gap-1 rounded-[14px] bg-[#e7e4dd] p-1 dark:bg-[#44424a]",
        line: "gap-1.5 border-b-2 border-[#e7e4dd] bg-transparent dark:border-[#44424a] group-data-[orientation=vertical]/tabs:border-r-2 group-data-[orientation=vertical]/tabs:border-b-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-0 font-heading font-extrabold uppercase text-[#8f8b98] transition-colors duration-150 hover:text-[#2b2a33] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.74_0.14_235)] disabled:pointer-events-none disabled:opacity-50 dark:text-[#a6a1af] dark:hover:text-white group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:rounded-[10px] group-data-[variant=default]/tabs-list:px-4 group-data-[variant=default]/tabs-list:pt-[11px] group-data-[variant=default]/tabs-list:pb-[9px] group-data-[variant=default]/tabs-list:text-xs group-data-[variant=default]/tabs-list:leading-none group-data-[variant=default]/tabs-list:tracking-[0.06em] group-data-[variant=default]/tabs-list:data-[state=active]:bg-white group-data-[variant=default]/tabs-list:data-[state=active]:text-[oklch(0.58_0.14_240)] group-data-[variant=default]/tabs-list:data-[state=active]:shadow-[0_3px_0_#d6d2c8] dark:group-data-[variant=default]/tabs-list:data-[state=active]:bg-[#36333d] dark:group-data-[variant=default]/tabs-list:data-[state=active]:text-[#71caff] dark:group-data-[variant=default]/tabs-list:data-[state=active]:shadow-[0_3px_0_#25232b]",
        "group-data-[variant=line]/tabs-list:-mb-0.5 group-data-[variant=line]/tabs-list:rounded-t-[10px] group-data-[variant=line]/tabs-list:border-b-4 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-3.5 group-data-[variant=line]/tabs-list:py-3 group-data-[variant=line]/tabs-list:text-sm group-data-[variant=line]/tabs-list:leading-none group-data-[variant=line]/tabs-list:tracking-[0.05em] group-data-[variant=line]/tabs-list:hover:bg-[#f3f1ec] group-data-[variant=line]/tabs-list:data-[state=active]:border-b-[oklch(0.74_0.14_235)] group-data-[variant=line]/tabs-list:data-[state=active]:text-[oklch(0.58_0.14_240)] dark:group-data-[variant=line]/tabs-list:hover:bg-[#36333d] dark:group-data-[variant=line]/tabs-list:data-[state=active]:text-[#71caff] group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:mb-0 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:-mr-0.5 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:border-r-4 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:border-b-0 group-data-[orientation=vertical]/tabs:group-data-[variant=line]/tabs-list:data-[state=active]:border-r-[oklch(0.74_0.14_235)]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
