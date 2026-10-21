"use client"

import * as React from "react"
import { cn } from "cn"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
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
 * Slides open and shut (tw-animate-css keyframes on the height Radix
 * measures), so what follows moves down with it instead of jumping; Radix
 * keeps the content mounted until the closing slide ends. Instant under
 * reduced motion. Spacing above the content belongs inside it as padding:
 * a gap outside would appear in one frame.
 *
 * Clipped only while it moves (2026-10-21): once open and still, nothing is
 * cut, so the cards' shadows inside show whole. (A clip widened with
 * padding, tried first, held the slide at its start and made it jerk.)
 */
function CollapsibleContent({
  className,
  onAnimationStart,
  onAnimationEnd,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [settled, setSettled] = React.useState(false)
  // Open from the start, as a group shown unfolded: nothing to clip.
  React.useLayoutEffect(() => {
    if (ref.current?.dataset.state === "open") setSettled(true)
  }, [])

  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={ref}
      data-slot="collapsible-content"
      className={cn(
        settled ? "overflow-visible" : "overflow-hidden",
        "[--tw-duration:250ms] [--tw-ease:cubic-bezier(0.2,0,0,1)] motion-safe:data-[state=closed]:animate-collapsible-up motion-safe:data-[state=open]:animate-collapsible-down",
        className
      )}
      onAnimationStart={(event) => {
        if (event.target === event.currentTarget) setSettled(false)
        onAnimationStart?.(event)
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.currentTarget.dataset.state === "open") setSettled(true)
        onAnimationEnd?.(event)
      }}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
