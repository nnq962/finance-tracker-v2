"use client"

import * as React from "react"
import { createPortal } from "react-dom"

const subscribe = () => () => {}

/** The slot in the desktop top bar (app/(main)/layout.tsx) a page's tools move into. */
export const pageTopBarToolsId = "page-top-bar-tools"

/**
 * A page's tools and actions in the desktop top bar, beside the bell and the
 * theme switch, for pages whose name the sidebar already shows (2026-10-21):
 * no row of their own above the content. Shown from md up; phones keep them
 * in the page's own row.
 */
export function PageTopBarTools({ children }: { children: React.ReactNode }) {
  // The slot is the layout's, there before any page: read once it is mounted, none on the server.
  const target = React.useSyncExternalStore(
    subscribe,
    () => document.getElementById(pageTopBarToolsId),
    () => null,
  )

  if (!target) return null
  return createPortal(<div className="hidden items-center gap-2 md:flex">{children}</div>, target)
}
