"use client"

import * as React from "react"

/** Where this device keeps its recent searches: a convenience of the viewer's own, nothing the account needs. */
const storageKey = "timi:transaction-searches"
/** As many as fit the search screen above the keyboard. */
const limit = 8
const changed = "timi:transaction-searches-changed"

const empty: string[] = []
// The last read, so the snapshot stays the same array while nothing changed.
let cache: { raw: string | null; items: string[] } = { raw: null, items: empty }

function read(): string[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(storageKey)
  } catch {
    // Storage blocked (a private window): nothing kept.
  }
  if (raw === cache.raw) return cache.items
  let items = empty
  try {
    const value = JSON.parse(raw ?? "[]")
    if (Array.isArray(value)) items = value.filter((item): item is string => typeof item === "string").slice(0, limit)
  } catch {
    // Not ours or broken: start again.
  }
  cache = { raw, items }
  return items
}

function write(items: string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  } catch {
    // Storage blocked: the history is not kept.
  }
  window.dispatchEvent(new Event(changed))
}

function subscribe(onChange: () => void) {
  window.addEventListener(changed, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(changed, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/** One spelling for comparing: the same words differently cased or composed are one search. */
const keyOf = (query: string) => query.normalize("NFC").trim().toLocaleLowerCase("vi")

/**
 * The searches done on the transactions page, newest first (2026-10-24): kept
 * on this device, at most eight, a search done again moving to the top. None
 * on the server's render, so server and client draw the same page.
 */
export function useSearchHistory() {
  const items = React.useSyncExternalStore(subscribe, read, () => empty)
  const update = (next: string[]) => write(next.slice(0, limit))

  return {
    items,
    add: (query: string) => {
      const text = query.normalize("NFC").trim()
      if (!text) return
      update([text, ...read().filter((item) => keyOf(item) !== keyOf(text))])
    },
    remove: (query: string) => update(read().filter((item) => item !== query)),
    clear: () => update([]),
  }
}
