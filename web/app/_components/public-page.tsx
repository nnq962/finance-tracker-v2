import type * as React from "react"

/**
 * A public page beside the landing (FAQ, the policies; 2026-10-20): the
 * landing's header and footer around one reading column, 2xl wide, with the
 * section label, the title and a lead line the landing's headings use.
 */
export function PublicPage({ label, title, lead, children }: { label: string; title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="surface-grouped mx-auto w-full max-w-2xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:pb-24">
      <div className="mb-8 flex flex-col gap-3">
        <span className="w-fit rounded-full bg-track px-3 py-1 text-xs font-semibold">{label}</span>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {lead ? <p className="text-base leading-7 text-muted-foreground">{lead}</p> : null}
      </div>
      <div className="space-y-6">{children}</div>
    </main>
  )
}
