"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import { cn } from "cn"
import { Accordion as AccordionPrimitive } from "radix-ui"

import { Collapse } from "@/components/app/collapse"

type AccordionValue = string | string[]

/** Whether an item (by its value) is open, for its content's fold. */
const AccordionOpen = React.createContext<(item: string) => boolean>(() => false)
const AccordionItemValue = React.createContext("")

/** Keeps the open items itself (controlled or not), so each content knows when to fold. */
function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  const { value: valueProp, defaultValue, onValueChange, ...rest } = props as typeof props & {
    value?: AccordionValue
    defaultValue?: AccordionValue
    onValueChange?: (value: AccordionValue) => void
  }
  const [valueState, setValueState] = React.useState<AccordionValue>(
    defaultValue ?? (props.type === "multiple" ? [] : "")
  )
  const value = valueProp ?? valueState
  const isOpen = (item: string) => (Array.isArray(value) ? value.includes(item) : value === item)
  const root = {
    ...rest,
    value,
    onValueChange: (next: AccordionValue) => {
      setValueState(next)
      onValueChange?.(next)
    },
  } as React.ComponentProps<typeof AccordionPrimitive.Root>

  return (
    <AccordionOpen.Provider value={isOpen}>
      <AccordionPrimitive.Root data-slot="accordion" {...root} />
    </AccordionOpen.Provider>
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionItemValue.Provider value={props.value}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        className={cn("border-b last:border-b-0", className)}
        {...props}
      />
    </AccordionItemValue.Provider>
  )
}

/** The question row: text on the left, a round + that turns into × when open. */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex min-h-14 flex-1 items-center justify-between gap-3 py-4 text-left text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-field transition-transform duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-data-[state=open]/accordion-trigger:rotate-45 motion-reduce:duration-150 motion-reduce:ease-out"
        >
          <PlusIcon className="size-4" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

/**
 * The answer, folded with `Collapse` (2026-10-24; was Radix's height keyframes
 * under overflow-hidden, which cut shadows and could not turn back mid-way):
 * 250ms, 150ms when motion is reduced. Kept mounted, inert while shut.
 */
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const open = React.useContext(AccordionOpen)(React.useContext(AccordionItemValue))
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      forceMount
      className="text-sm text-muted-foreground"
      {...props}
    >
      <Collapse open={open} contentClassName={cn("pb-4 leading-relaxed", className)}>
        {children}
      </Collapse>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
