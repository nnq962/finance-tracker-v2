/**
 * Keeps the status bar in the app's colour while an overlay is open. Put it
 * inside an overlay (the dimmed layer under a drawer, sheet or dialog), after
 * the dim, so it sits above it.
 *
 * Safari 26 ignores theme-color. With a see-through fixed layer at the
 * screen's top edge it shows what is under the status bar, which the veil
 * had dimmed: the bar darkened with every sheet and lightened again as the
 * veil faded out. With an opaque fixed element there, it tints the bar with
 * that element's colour. This strip covers the status bar's height in the
 * app's background, so either way the bar stays the app's colour and only
 * the content below dims and blurs. 1px at least, for Safari's tab view,
 * where the inset is 0 but the bar is still tinted from the top edge.
 * Phones only: on a wider screen it would be a line over the veil.
 */
export function StatusBarTint() {
  return (
    <div
      aria-hidden="true"
      data-slot="status-bar-tint"
      className="pointer-events-none fixed inset-x-0 top-0 h-[max(env(safe-area-inset-top,0px),1px)] bg-background md:hidden"
    />
  )
}
