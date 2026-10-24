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
        // A segmented control after Apple's iOS 26 kit (2026-10-24): 36 tall,
        // 2 in, 4 between segments, the rail Fills/Tertiary, the chosen
        // segment's Selected Fill sliding under ink text. Default and
        // segmented are one look now; the ink pill (2026-10-19) is gone.
        default: "gap-1 rounded-full bg-segment p-0.5 group-data-horizontal/tabs:h-9",
        segmented: "gap-1 rounded-full bg-segment p-0.5 group-data-horizontal/tabs:h-9",
        // Tabs over content: a short bar slides under the chosen one.
        line: "rounded-none border-b border-separator bg-transparent group-data-horizontal/tabs:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/** Where each remembered list (`memoryKey`) last drew its indicator. */
const indicatorMemory = new Map<string, { x: number; width: number }>()

/**
 * The indicator is one element moved with a CSS transition (translate and
 * width) to the chosen trigger's measured box: compositor-friendly, so it
 * glides on iOS Safari as on desktop. With reduced motion it moves in a
 * short ease instead of a spring.
 *
 * `memoryKey` (2026-10-21): a list that is rendered anew when its choice
 * changes (Giao dịch | Vay nợ, each view drawing its own) starts its
 * indicator where the last one with that key left it and slides on, so the
 * switch moves instead of jumping.
 */
function TabsList({
  className,
  variant = "default",
  memoryKey,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants> & { memoryKey?: string }) {
  const { value } = React.useContext(TabsContext)
  const list = React.useRef<HTMLDivElement>(null)
  // A fresh list with a remembered key is drawn first where the last one was, then slides to its choice.
  const [box, setBox] = React.useState<{ x: number; width: number } | null>(() =>
    memoryKey ? (indicatorMemory.get(memoryKey) ?? null) : null,
  )
  const startsRemembered = React.useRef(box !== null)
  const indicator = React.useRef<HTMLSpanElement>(null)

  // Leaving mid-slide (a view that draws its own switch swapped out by the
  // tap, 2026-10-21), the list remembers where the thumb is on screen, not
  // where it was heading: the next one carries the slide on from there at the
  // designed pace, instead of starting at the end and cutting it short.
  React.useLayoutEffect(() => {
    const element = indicator
    return () => {
      const thumb = element.current
      if (!memoryKey || !thumb) return
      const style = getComputedStyle(thumb)
      const x = Number.parseFloat(style.translate.split(" ")[0] ?? "")
      const width = Number.parseFloat(style.width)
      if (Number.isFinite(x) && Number.isFinite(width)) indicatorMemory.set(memoryKey, { x, width })
    }
  }, [memoryKey])

  React.useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const measure = () => {
      // Hidden (display: none, e.g. under a deeper screen of a sheet), the
      // list measures nothing: keep the last box, or the indicator would
      // spring from nothing back to its size when the list shows again.
      if (element.offsetWidth === 0) return
      const chosen = element.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]')
      const next = chosen ? { x: chosen.offsetLeft, width: chosen.offsetWidth } : null
      if (memoryKey && next) indicatorMemory.set(memoryKey, next)
      // Written to the thumb as well: drawn from a place React does not know of (below), its
      // state may already hold this box, and React would then leave the thumb where it is.
      if (next && indicator.current) {
        indicator.current.style.translate = `${next.x}px 0`
        indicator.current.style.width = `${next.width}px`
      }
      setBox(next)
    }
    let frame = 0
    if (startsRemembered.current) {
      // Rendered alongside the list it replaces, this one read the memory before that one
      // left; where that one's thumb was on leaving is in the memory only now, so the thumb
      // is put there before the first paint.
      const left = memoryKey ? indicatorMemory.get(memoryKey) : undefined
      if (left && indicator.current) {
        indicator.current.style.translate = `${left.x}px 0`
        indicator.current.style.width = `${left.width}px`
      }
      // Two frames on, so the remembered place is painted before the slide starts.
      startsRemembered.current = false
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(measure)
      })
    } else {
      measure()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [value, memoryKey])

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
          ref={indicator}
          aria-hidden="true"
          data-slot="tabs-indicator"
          className="absolute top-0.5 bottom-0.5 left-0 rounded-full bg-segment-thumb shadow-segment-thumb transition-[translate,width] duration-250 ease-[cubic-bezier(0.2,0,0,1)] will-change-[translate] group-data-[variant=line]/tabs-list:top-auto group-data-[variant=line]/tabs-list:-bottom-px group-data-[variant=line]/tabs-list:h-0.5 group-data-[variant=line]/tabs-list:bg-foreground group-data-[variant=line]/tabs-list:shadow-none motion-reduce:duration-150 motion-reduce:ease-out"
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
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold whitespace-nowrap text-foreground/60 transition-colors duration-150 ease-out outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // One weight chosen or not (2026-10-21): bolding the chosen label moved the words while the pill slid.
        "data-active:text-foreground group-data-[variant=line]/tabs-list:rounded-none",
        // Segmented (both looks): 32 tall in the 36 rail, its touch area stretched to 44 (2026-10-24).
        "group-data-[variant=default]/tabs-list:after:absolute group-data-[variant=default]/tabs-list:after:inset-x-0 group-data-[variant=default]/tabs-list:after:-inset-y-1.5",
        "group-data-[variant=segmented]/tabs-list:after:absolute group-data-[variant=segmented]/tabs-list:after:inset-x-0 group-data-[variant=segmented]/tabs-list:after:-inset-y-1.5",
        // Before the indicator is measured (first paint), the chosen trigger fills itself.
        "[[data-slot=tabs-list]:not([data-variant=line]):not([data-ready])>&]:data-active:bg-segment-thumb",
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
