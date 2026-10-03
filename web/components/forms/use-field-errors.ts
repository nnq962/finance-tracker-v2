"use client"

import * as React from "react"

/**
 * A form's errors per field, checked before it is sent and shown under each
 * field instead of the browser's own bubbles (the form is `noValidate`).
 */
export function useFieldErrors<Name extends string>() {
  const [errors, setErrors] = React.useState<Partial<Record<Name, string>>>({})

  /** Clears a field's error once the user changes it. */
  const clear = React.useCallback((name: Name) => {
    setErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }, [])

  /**
   * Shows what was found and brings the first field in `order` into view
   * with the focus. Returns whether anything is wrong.
   */
  const report = (
    found: Partial<Record<Name, string>>,
    order: readonly Name[],
    elementId: (name: Name) => string,
  ) => {
    setErrors(found)
    const first = order.find((name) => found[name])
    if (!first) return false
    const element = document.getElementById(elementId(first))
    element?.focus({ preventScroll: true })
    element?.scrollIntoView({ block: "center", behavior: "smooth" })
    return true
  }

  const reset = React.useCallback(() => setErrors({}), [])

  return { errors, clear, report, reset }
}
