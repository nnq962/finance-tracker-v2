import { notFound } from "next/navigation"

import { Page, PageHeader } from "@/components/page"

import { DesignCatalog } from "./_components/design-catalog"

/**
 * The design system's catalogue: every token and block the pages are built
 * from, live, in both themes. Dev server only; see docs/design/README.md.
 */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <Page className="space-y-8">
      <PageHeader title="Thiết kế" />
      <DesignCatalog />
    </Page>
  )
}
