import type * as React from "react"

import { cn } from "@/lib/utils"

/** A landing section's heading: a small label, the title, a line under it. Centred unless `align="start"`. */
export function SectionHeading({
  anchor,
  id,
  label,
  title,
  children,
  align = "center",
  tone = "default",
}: {
  /** The section's anchor (#tinh-nang…): on the heading, so a jump lands it 24px under the sticky header (the page's scroll padding clears the header itself). */
  anchor?: string
  id: string
  label: React.ReactNode
  title: React.ReactNode
  children?: React.ReactNode
  align?: "center" | "start"
  /** inverse: on a black card. */
  tone?: "default" | "inverse"
}) {
  return (
    <div id={anchor} className={cn("flex max-w-2xl scroll-mt-6 flex-col gap-3", align === "center" && "mx-auto items-center text-center")}>
      <span
        className={cn(
          "w-fit rounded-full px-3 py-1 text-xs font-semibold",
          tone === "inverse" ? "bg-ai text-ai-foreground" : "bg-track text-foreground",
        )}
      >
        {label}
      </span>
      <h2 id={id} className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      {children ? (
        <p className={cn("text-base leading-7 sm:text-lg", tone === "inverse" ? "text-inverse-foreground/60" : "text-muted-foreground")}>
          {children}
        </p>
      ) : null}
    </div>
  )
}
