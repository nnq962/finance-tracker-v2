/**
 * The asterisk after a required field's label. Screen readers already hear
 * "required" from the control itself, so the mark is hidden from them.
 */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="-ml-1 text-destructive">
      *
    </span>
  )
}
