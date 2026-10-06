import type * as React from "react"

import { Card, CardContent } from "@/components/ui/card"

/**
 * A form's fields on a white card, on the grey of a sheet or page, with an
 * optional caption above, a grey note below and more content after it. On
 * the card the fields are grey. Group a form's fields in one section; a
 * lone field in its own card reads as a box in a box.
 */
export function FormSection({
  title,
  description,
  after,
  children,
}: {
  title?: React.ReactNode
  /** A short grey note below the card. */
  description?: React.ReactNode
  /** Content below the card, such as a warning row. */
  after?: React.ReactNode
  /** Usually a FieldGroup. */
  children: React.ReactNode
}) {
  return (
    <section data-slot="form-section" className="space-y-2">
      {title ? <h2 className="px-4 text-sm font-medium text-muted-foreground">{title}</h2> : null}
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
      {description ? <p className="px-4 text-sm text-muted-foreground">{description}</p> : null}
      {after}
    </section>
  )
}
