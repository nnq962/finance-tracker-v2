"use client"

import * as React from "react"
import { ChevronLeftIcon } from "lucide-react"

import { PageDots } from "@/components/app/page-dots"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FlowStep = {
  /** Stable and unique, e.g. the step's title. */
  key: string
  /** What the step is called, for screen readers: "Bước 2 / 5" is added. */
  label: string
  content: React.ReactNode
}

/**
 * Steps shown one at a time, as an app's onboarding or a how-to: they swipe
 * sideways and snap, page dots below say where one is (and go to a step),
 * then the footer: ‹ narrows in from nothing past the first step as the main
 * button gives it room (as the filters' Xoá lọc), and the main button goes on,
 * its label fading into `doneLabel` on the last step, which calls `onDone`.
 *
 * `step` is the caller's, e.g. to start over each time it opens or to hide a
 * Skip on the last step. A tap on a button sets it at once; the slide that
 * follows does not change it on the way (which would make the footer shrink
 * and grow back and its label flip), only a finger does. Each step fills the
 * flow's height when the flow is given one (`className="flex-1"` in a column).
 */
export function StepFlow({
  steps,
  step,
  onStepChange,
  label,
  nextLabel = "Tiếp",
  doneLabel,
  onDone,
  className,
}: {
  steps: FlowStep[]
  step: number
  onStepChange: (step: number) => void
  /** What the steps are about, for screen readers, e.g. "Các bước cài". */
  label: string
  nextLabel?: string
  doneLabel: string
  onDone: () => void
  className?: string
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  // The step a button is sliding to; until it is there, the scroll passing the
  // steps between leaves the step alone.
  const sliding = React.useRef<number | null>(null)
  const last = step === steps.length - 1

  const goTo = (index: number) => {
    const element = scroller.current
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    sliding.current = index
    element?.scrollTo({ left: index * element.clientWidth, behavior: reduce ? "auto" : "smooth" })
    onStepChange(index)
  }

  // A step set from outside (back to the first on opening again) is shown at once.
  React.useEffect(() => {
    const element = scroller.current
    if (!element || sliding.current !== null || !element.clientWidth) return
    if (Math.round(element.scrollLeft / element.clientWidth) !== step) element.scrollTo({ left: step * element.clientWidth })
  }, [step])

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        ref={scroller}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        onScroll={(event) => {
          const element = event.currentTarget
          if (sliding.current !== null) {
            // There: the finger has the steps again.
            if (Math.abs(element.scrollLeft - sliding.current * element.clientWidth) < 2) sliding.current = null
            return
          }
          const at = Math.min(steps.length - 1, Math.round(element.scrollLeft / element.clientWidth))
          if (at !== step) onStepChange(at)
        }}
        // A finger taking over mid-slide decides the step itself.
        onPointerDown={() => {
          sliding.current = null
        }}
        className="flex min-h-0 w-full flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {steps.map((item, index) => (
          <section
            key={item.key}
            aria-roledescription="slide"
            aria-label={`${item.label}, bước ${index + 1} / ${steps.length}`}
            inert={index !== step}
            className="flex w-full shrink-0 snap-center flex-col"
          >
            {item.content}
          </section>
        ))}
      </div>

      <PageDots count={steps.length} value={step} onValueChange={goTo} className="mt-5 justify-center" />

      <div className="mt-5 flex w-full items-center">
        <div
          inert={step === 0}
          className={cn(
            "min-w-0 shrink-0 overflow-hidden transition-[flex-basis,margin,opacity] duration-300 ease-out motion-reduce:transition-none",
            step > 0 ? "mr-2 basis-11" : "mr-0 basis-0 opacity-0",
          )}
        >
          <Button type="button" variant="secondary" size="icon" aria-label="Bước trước" onClick={() => goTo(step - 1)}>
            <ChevronLeftIcon />
          </Button>
        </div>
        <Button type="button" className="min-w-0 flex-1" onClick={() => (last ? onDone() : goTo(step + 1))}>
          {/* Both labels in one cell, so the button keeps its size: the old one
              fades out first, then the new one in, never the two over each other. */}
          <span className="grid">
            {[
              { text: nextLabel, shown: !last },
              { text: doneLabel, shown: last },
            ].map(({ text, shown }) => (
              <span
                key={text}
                aria-hidden={!shown}
                className={cn(
                  "col-start-1 row-start-1 transition-opacity ease-out motion-reduce:transition-none",
                  shown ? "delay-100 duration-150" : "opacity-0 duration-100",
                )}
              >
                {text}
              </span>
            ))}
          </span>
        </Button>
      </div>
    </div>
  )
}
