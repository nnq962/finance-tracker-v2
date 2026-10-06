import type * as React from "react"

import { Card, CardContent } from "@/components/ui/card"

/**
 * A group of form fields on a white card, with an optional caption above
 * and a note below, like SettingsGroup for rows. On a grey screen sheet
 * the fields inside stay grey, the look of a form on a white surface.
 */
export function FormSection({
  title,
  footer,
  children,
}: {
  title?: React.ReactNode
  footer?: React.ReactNode
  /** Usually a FieldGroup, or a single Field. */
  children: React.ReactNode
}) {
  return (
    <section data-slot="form-section" className="space-y-2">
      {title ? <h2 className="px-4 text-sm font-medium text-muted-foreground">{title}</h2> : null}
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
      {footer ? <p className="px-4 text-sm text-muted-foreground">{footer}</p> : null}
    </section>
  )
}
