"use client"

import * as React from "react"
import dynamic from "next/dynamic"

import { preloadWhenIdle } from "@/lib/preload-when-idle"

/*
 * The assistant itself (its frame, answers, drafts and speech) loads apart
 * from the page and comes in once the page is idle (2026-10-17); only these
 * ways in are in every page's first load. Opened before it has come, it
 * shows as soon as it arrives.
 */
const loadFrame = () => import("./assistant-frame")
const AssistantFrame = dynamic(() => loadFrame().then((module) => module.AssistantFrame), { ssr: false })
preloadWhenIdle(loadFrame)

/* ------------------------------------------------------------- the opener */

const AssistantContext = React.createContext<{ open: () => void } | null>(null)

/** Opens the assistant, from anywhere inside the app's shell. */
export function useOpenAssistant() {
  const context = React.useContext(AssistantContext)
  if (!context) throw new Error("useOpenAssistant needs an AssistantProvider")
  return context.open
}

/**
 * The AI assistant, one for the whole app (2026-10-11): opened from the
 * button beside the tab bar on phones, from the header on computers. It sits
 * over the page, dimmed, with its bar where the tab bar was.
 */
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const value = React.useMemo(() => ({ open: () => setOpen(true) }), [])
  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantFrame open={open} onClose={() => setOpen(false)} />
    </AssistantContext.Provider>
  )
}
