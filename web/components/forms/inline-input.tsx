import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A field typed in place at the end of a row (SettingsFieldRow), as iOS
 * settings have them: no box, the text right-aligned, filling the row up to
 * its label so a tap anywhere there brings the keyboard up. `unit` (đ, ngày,
 * giờ) follows the text, faded, once something is typed; "đ" sits against
 * the number as Money writes it, a word a space apart.
 */
export function InlineInput({ unit, value, ...props }: React.ComponentProps<"input"> & { unit?: string }) {
  return (
    <span className="flex flex-1 items-baseline justify-end text-sm">
      <input
        type="text"
        autoComplete="off"
        value={value}
        className="w-0 min-w-16 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-muted-foreground aria-invalid:text-destructive"
        {...props}
      />
      {unit && value ? (
        <span aria-hidden="true" className={cn("shrink-0 text-muted-foreground", unit.length > 1 && "ml-1")}>
          {unit}
        </span>
      ) : null}
    </span>
  )
}
