"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * iOS's collapsing large title, for phones: placed right below a page's large
 * title, it shows a small, translucent bar with the same title at the top of
 * the screen once that title has scrolled away, and hides when it is back.
 * The bar repeats the heading, so it is hidden from screen readers.
 */
export function CompactTitleBar({ title }: { title: string }) {
  const sentinel = React.useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const element = sentinel.current
    if (!element) return
    // The bar is 44px below the safe area; the title counts as gone once it
    // has passed under it.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: "-44px 0px 0px 0px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <span ref={sentinel} aria-hidden="true" className="block h-0" />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-30 border-b border-transparent bg-background/0 pt-[env(safe-area-inset-top,0px)] transition-[background-color,border-color] duration-200 md:hidden",
          visible && "border-border/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <p
          className={cn(
            "flex h-11 items-center justify-center px-16 text-[15px] font-semibold opacity-0 transition-[opacity,translate] duration-200",
            visible ? "translate-y-0 opacity-100" : "translate-y-1",
          )}
        >
          <span className="truncate">{title}</span>
        </p>
      </div>
    </>
  )
}
