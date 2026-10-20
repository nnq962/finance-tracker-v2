"use client"

import * as React from "react"

/**
 * A `position: sticky` band that knows when it is pinned: `data-stuck` is set
 * while it sits at its sticky top, so it can take a background only then and
 * leave the cards' shadows uncovered while it scrolls with the page
 * (2026-10-20, the white page with lifted cards). Its sticky `top` is read
 * from the computed style, so it follows the classes given to it.
 */
export function StickyBand({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = React.useState(false)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    const top = Number.parseFloat(getComputedStyle(element).top) || 0
    // Watched against what scrolls it: the page, or a pane scrolling on its
    // own (the transactions list on wide screens).
    let root: HTMLElement | null = element.parentElement
    while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement
    if (root === document.scrollingElement || root === document.body) root = null
    // Pinned, the band reaches a pixel past the line it sticks to; scrolling
    // with the page it is either wholly inside or still below it.
    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootTop = entry.rootBounds?.top ?? 0
        setStuck(entry.intersectionRatio < 1 && entry.boundingClientRect.top <= rootTop + top + 1)
      },
      { root, rootMargin: `${-(top + 1)}px 0px 0px 0px`, threshold: [1] },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} data-stuck={stuck ? "" : undefined} className={className}>
      {children}
    </div>
  )
}
