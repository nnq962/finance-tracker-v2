"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import { Collapse } from "@/components/app/collapse"

/** Whether the nearest Collapsible is open, for its content's fold. */
const CollapsibleOpen = React.createContext(false)

function Collapsible({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  return (
    <CollapsibleOpen.Provider value={open}>
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        open={open}
        onOpenChange={(next) => {
          setOpenState(next)
          onOpenChange?.(next)
        }}
        {...props}
      />
    </CollapsibleOpen.Provider>
  )
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/**
 * Folds open and shut with `Collapse` (2026-10-24; was tw-animate keyframes on
 * the height Radix measures, which could not turn back when tapped again
 * mid-way and went instant under reduced motion): the height eases to what
 * the content needs and back, 250ms, 150ms when motion is reduced, turning
 * back smoothly mid-way; shadows inside show whole once open. Radix keeps the
 * content mounted (`forceMount`), the fold makes it inert while shut.
 * `className` lands on the box inside the fold, so spacing above the content
 * (padding) folds with it.
 */
function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  const open = React.useContext(CollapsibleOpen)
  return (
    <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" forceMount {...props}>
      <Collapse open={open} contentClassName={className}>
        {children}
      </Collapse>
    </CollapsiblePrimitive.CollapsibleContent>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
