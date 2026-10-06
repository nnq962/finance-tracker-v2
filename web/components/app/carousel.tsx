"use client"

import * as React from "react"

import { PageDots } from "@/components/app/page-dots"

/**
 * Cards in a row that snap one at a time under the finger, the next one
 * peeking in at the edge, with page dots below. Bleeds to the screen's edges
 * (--main-content-px, the page margin) on phones, so place it directly in a page or section.
 */
export function Carousel({
  children,
  label,
  className,
}: {
  children: React.ReactNode
  label: string
  className?: string
}) {
  const scroller = React.useRef<HTMLDivElement>(null)
  const [index, setIndex] = React.useState(0)
  const items = React.Children.toArray(children)

  const goTo = (next: number) => {
    const target = scroller.current?.children[next] as HTMLElement | undefined
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className={className}>
      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget
          const first = element.children[0] as HTMLElement | undefined
          if (!first) return
          const step = first.offsetWidth + 12
          setIndex(Math.min(items.length - 1, Math.round(element.scrollLeft / step)))
        }}
        className="-mx-(--main-content-px) flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--main-content-px) overscroll-x-contain sm:mx-0 sm:px-0"
      >
        {items.map((item, itemIndex) => (
          <div
            key={itemIndex}
            aria-roledescription="slide"
            aria-label={`${itemIndex + 1} / ${items.length}`}
            className="w-[82%] shrink-0 snap-center sm:w-72"
          >
            {item}
          </div>
        ))}
      </div>
      <PageDots count={items.length} value={index} onValueChange={goTo} className="mt-3 justify-center" />
    </div>
  )
}
