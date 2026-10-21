"use client"

import { Card, CardContent } from "@/components/ui/card"

/**
 * A policy's table of contents: each title scrolls its section into view in
 * whatever scrolls (the page, or the sheet in Cài đặt), without touching the
 * address as a #link would (2026-10-21).
 */
export function LegalContents({ titles }: { titles: string[] }) {
  return (
    <Card>
      <CardContent>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Mục lục</p>
        <ol className="space-y-1 text-sm">
          {titles.map((title, index) => (
            <li key={title}>
              <a
                href={`#muc-${index + 1}`}
                onClick={(event) => {
                  const section = document.getElementById(`muc-${index + 1}`)
                  if (!section) return
                  event.preventDefault()
                  section.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "start",
                  })
                }}
                className="flex min-h-9 items-center gap-3 rounded-lg outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{index + 1}.</span>
                {title}
              </a>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
