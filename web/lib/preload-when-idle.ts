/**
 * Loads code split off the first load (a sheet's content, the assistant)
 * once the browser is idle after the page has come up, so it is there by the
 * first tap (2026-10-17). Safari has no requestIdleCallback: a timer there.
 * Called at a module's top level, it preloads on the pages that use it.
 */
export function preloadWhenIdle(load: () => Promise<unknown>) {
  if (typeof window === "undefined") return
  const run = () => void load().catch(() => undefined)
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 2000)
}
