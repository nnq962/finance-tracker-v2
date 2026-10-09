/**
 * Keeps the status bar in the app's colour while an overlay is open. Put it
 * inside an overlay (the dimmed layer under a drawer, sheet or dialog).
 *
 * Safari 26 ignores theme-color and tints the status bar from the
 * background-color of a fixed element at the screen's top edge; it reads it
 * even from an invisible element. Under a see-through veil it worked out a
 * dimmed grey of its own, so the bar changed colour with every sheet. This
 * strip is that element: fixed along the top, in the app's background,
 * never seen (opacity 0) and never in the way of a tap.
 */
export function StatusBarTint() {
  return (
    <div
      aria-hidden="true"
      data-slot="status-bar-tint"
      className="pointer-events-none fixed inset-x-0 top-0 h-[calc(env(safe-area-inset-top,0px)+0.5rem)] bg-background opacity-0"
    />
  )
}
