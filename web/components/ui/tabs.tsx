"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

// The chosen value, so the list can move its indicator under that trigger.
const TabsContext = React.createContext<{ value?: string }>({})

function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const current = value ?? uncontrolled

  return (
    <TabsContext.Provider value={{ value: current }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        value={current}
        onValueChange={(next) => {
          setUncontrolled(next)
          onValueChange?.(next)
        }}
        className={cn(
          "group/tabs flex gap-2 data-horizontal:flex-col",
          className
        )}
        {...props}
      />
    </TabsContext.Provider>
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // A segmented control, as in iOS: a white thumb slides on a grey track.
        default: "rounded-full bg-track p-1 group-data-horizontal/tabs:h-[52px]",
        // Tabs over content: a short bar slides under the chosen one.
        line: "rounded-none border-b bg-transparent group-data-horizontal/tabs:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * The indicator is one element moved with a CSS transition (translate and
 * width) to the chosen trigger's measured box: compositor-friendly, so it
 * glides on iOS Safari as on desktop. With reduced motion it moves in a
 * short ease instead of a spring.
 */
function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const { value } = React.useContext(TabsContext)
  const list = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState<{ x: number; width: number } | null>(null)

  React.useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const measure = () => {
      const chosen = element.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]')
      setBox(chosen ? { x: chosen.offsetLeft, width: chosen.offsetWidth } : null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [value])

  return (
    <TabsPrimitive.List
      ref={list}
      data-slot="tabs-list"
      data-variant={variant}
      data-ready={box ? "" : undefined}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {box ? (
        <span
          aria-hidden="true"
          data-slot="tabs-indicator"
          className="absolute top-1 bottom-1 left-0 rounded-full bg-card shadow-[0_1px_4px_rgb(0_0_0/0.12)] transition-[translate,width] duration-[450ms] ease-[cubic-bezier(.34,1.3,.64,1)] will-change-transform group-data-[variant=line]/tabs-list:top-auto group-data-[variant=line]/tabs-list:-bottom-px group-data-[variant=line]/tabs-list:h-0.5 group-data-[variant=line]/tabs-list:bg-foreground group-data-[variant=line]/tabs-list:shadow-none motion-reduce:duration-150 motion-reduce:ease-out dark:bg-foreground/15 dark:group-data-[variant=line]/tabs-list:bg-foreground"
          style={{ width: box.width, translate: `${box.x}px 0` }}
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
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
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium whitespace-nowrap text-foreground/60 transition-colors duration-200 outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-active:font-semibold data-active:text-foreground group-data-[variant=line]/tabs-list:rounded-none",
        // Before the indicator is measured (first paint), the chosen trigger fills itself.
        "[[data-slot=tabs-list][data-variant=default]:not([data-ready])>&]:data-active:bg-card dark:[[data-slot=tabs-list][data-variant=default]:not([data-ready])>&]:data-active:bg-foreground/15",
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
