/** The nearest ancestor that scrolls vertically, else the document's scroller. */
function scrollParent(element: HTMLElement): HTMLElement {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

/**
 * Brings an element into view by scrolling only the one box it scrolls in,
 * e.g. a sheet's content. The browser's scrollIntoView scrolls every
 * ancestor it can, the sheet itself and the page under it too; on iOS that
 * pushed an open sheet up off its place, where it stayed.
 *
 * `center` puts it in the middle; `nearest` moves it just enough to show it
 * whole, 16px clear of the edge, and not at all when it already shows.
 * Smooth unless motion is reduced.
 */
export function scrollIntoViewWithin(element: HTMLElement, { block = "center" }: { block?: "center" | "nearest" } = {}) {
  const scroller = scrollParent(element)
  const isDocument = scroller === document.scrollingElement || scroller === document.documentElement
  const view = isDocument ? { top: 0, bottom: window.innerHeight, height: window.innerHeight } : scroller.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  const margin = 16

  let delta = 0
  if (block === "center") delta = rect.top - view.top - (view.height - rect.height) / 2
  else if (rect.top < view.top + margin) delta = rect.top - view.top - margin
  else if (rect.bottom > view.bottom - margin) delta = Math.min(rect.bottom - view.bottom + margin, rect.top - view.top - margin)
  if (Math.abs(delta) < 1) return

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  scroller.scrollBy({ top: delta, behavior: reduce ? "auto" : "smooth" })
}
