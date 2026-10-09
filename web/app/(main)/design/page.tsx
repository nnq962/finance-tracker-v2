import { Page } from "@/components/page"
import { requireAdmin } from "@/lib/plans/admin"

import { DesignCatalog } from "./_components/design-catalog"

/**
 * The design system's catalogue: every token and block the pages are built
 * from, live, in both themes; see docs/design/README.md. For admins in
 * production (a 404 for anyone else), for anyone on the dev server.
 */
export default async function DesignPage() {
  if (process.env.NODE_ENV === "production") await requireAdmin()

  return (
    <Page>
      <DesignCatalog />
    </Page>
  )
}
