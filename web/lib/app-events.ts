/**
 * Asks the page on screen to open one of its sheets, from outside it (a
 * notification in the top bar's sheet): the add-transaction sheet on
 * Giao dịch, the plans on Tổng quan. The page listens while it is shown;
 * from another page, its address opens the sheet when it loads instead.
 */
export const appEvents = {
  addTransaction: { name: "finance:add-transaction", path: "/transactions", href: "/transactions?add=1" },
  openPlans: { name: "finance:open-plans", path: "/overview", href: "/overview?screen=plan" },
} as const

export type AppEvent = (typeof appEvents)[keyof typeof appEvents]

/** Runs `onEvent` whenever the event is sent, while the component is shown. */
export function listenToAppEvent(event: AppEvent, onEvent: () => void) {
  window.addEventListener(event.name, onEvent)
  return () => window.removeEventListener(event.name, onEvent)
}

/** Opens the sheet on the page on screen, or goes to the page that opens it. */
export function sendAppEvent(event: AppEvent, pathname: string, navigate: (href: string) => void) {
  if (pathname === event.path) window.dispatchEvent(new Event(event.name))
  else navigate(event.href)
}
