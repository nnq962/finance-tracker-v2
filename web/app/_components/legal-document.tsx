import Link from "next/link"

import { LandingFooter } from "@/app/_components/landing/landing-footer"
import { LandingHeader } from "@/app/_components/landing/landing-header"
import { PublicPage } from "@/app/_components/public-page"
import { LegalContents } from "@/app/_components/legal-contents"
import type { LegalDocument } from "@/lib/legal/types"

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })

/**
 * A policy's text (2026-10-21, apart from its page so Cài đặt can open it in
 * a sheet and come back): the intro, the table of contents, the numbered
 * sections, in whatever column holds it.
 */
export function LegalDocumentBody({ document }: { document: LegalDocument }) {
  return (
    <>
      <p className="text-base leading-7">{document.intro}</p>
      <LegalContents titles={document.sections.map((section) => section.title)} />
      {document.sections.map((section, index) => (
        <section key={section.title} id={`muc-${index + 1}`} className="scroll-mt-24 space-y-3 pt-4">
          <h2 className="text-xl font-semibold tracking-tight">
            {index + 1}. {section.title}
          </h2>
          {section.blocks.map((block, blockIndex) => {
            if (block.kind === "p") return <p key={blockIndex} className="text-base leading-7">{block.text}</p>
            if (block.kind === "list")
              return (
                <ul key={blockIndex} className="list-disc space-y-1.5 pl-5 text-base leading-7">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )
            return (
              <div key={blockIndex} className="overflow-x-auto rounded-2xl bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {block.columns.map((column) => (
                        <th key={column} className="px-4 py-3 align-top">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row[0]} className="border-t border-separator align-top">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className={cellIndex === 0 ? "px-4 py-3 font-medium" : "px-4 py-3 text-muted-foreground"}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </section>
      ))}
    </>
  )
}

/**
 * A policy page (2026-10-20): the landing's header and footer, the title
 * with its date and the link to the other policy, a table of contents card,
 * then the numbered sections in the reading column.
 */
export function LegalDocumentPage({ document, other }: { document: LegalDocument; other: { href: string; label: string } }) {
  return (
    <>
      <LandingHeader />
      <PublicPage
        label="Pháp lý"
        title={document.title}
        lead={
          <>
            Cập nhật {dateFormat.format(new Date(document.updated))} · Xem thêm{" "}
            <Link href={other.href} className="underline underline-offset-4">
              {other.label}
            </Link>
          </>
        }
      >
        <LegalDocumentBody document={document} />
      </PublicPage>
      <LandingFooter />
    </>
  )
}
