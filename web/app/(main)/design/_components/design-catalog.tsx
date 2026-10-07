"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

import { catalogSections, type CatalogSectionId } from "./catalog-kit"
import { BasicsSections } from "./sections-basics"
import { ContentSections } from "./sections-content"
import { InputSections } from "./sections-inputs"

/**
 * The design system's catalogue, after the "Thư viện UI" page of the Figma
 * Make mockup: a large title, a sticky row of chips that follows the scroll,
 * and numbered parts with live samples of every token and component.
 */
export function DesignCatalog() {
  const [active, setActive] = React.useState<CatalogSectionId>("foundation")
  const chips = React.useRef<HTMLDivElement>(null)

  // The chip of the part crossing the upper third of the screen is the current one.
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as CatalogSectionId)
        }
      },
      { rootMargin: "-30% 0px -65% 0px" },
    )
    for (const [id] of catalogSections) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    const row = chips.current
    const chip = row?.querySelector<HTMLElement>(`[data-id="${active}"]`)
    if (row && chip) {
      row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" })
    }
  }, [active])

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0">
      <header className="pt-1">
        {/* Opened from Settings, so back leads there. */}
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="secondary" size="icon">
            <Link href="/settings" aria-label="Cài đặt">
              <ChevronLeftIcon />
            </Link>
          </Button>
          {/* From md up the app header has the theme switch. */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-4 min-w-0">
          <p className="text-sm text-muted-foreground">Finance Tracker · hệ thống thiết kế</p>
          <h1 className="text-[28px] leading-tight font-medium tracking-tight">Thư viện UI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {catalogSections.length} nhóm component, tất cả đều chạm thử được.
          </p>
        </div>
      </header>

      <nav
        aria-label="Mục lục"
        className="sticky top-0 z-20 -mx-(--main-content-px) mt-4 bg-background/85 pt-[max(env(safe-area-inset-top,0px),0.75rem)] pb-3 backdrop-blur-xl md:top-16 md:pt-3"
      >
        <div ref={chips} className="flex gap-2 overflow-x-auto px-(--main-content-px)">
          {catalogSections.map(([id, title]) => (
            <Button
              key={id}
              data-id={id}
              size="sm"
              variant={active === id ? "default" : "secondary"}
              aria-current={active === id ? "true" : undefined}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            >
              {title}
            </Button>
          ))}
        </div>
      </nav>

      <BasicsSections />
      <InputSections />
      <ContentSections />
      <p className="pt-12 text-center text-xs text-muted-foreground">Chạm, kéo, vuốt thoải mái ✦</p>
    </div>
  )
}
