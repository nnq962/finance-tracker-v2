"use client"

import * as React from "react"
import { toast } from "sonner"

import { actionErrorMessage } from "@/lib/stale-deploy"

const UNDO_DELAY_MS = 6000
/** How long a sheet takes to close, so what it showed goes once it is out of the way. */
const HIDE_DELAY_MS = 350
const pendingDeletes = new Set<string>()

/**
 * What is being deleted, or was: a list leaves it out from the tap on (once
 * the sheet has closed), not six seconds later, and keeps it out until the
 * page has the data without it. A failed delete or an undo brings it back.
 */
let hidden: ReadonlySet<string> = new Set()
const listeners = new Set<() => void>()
function setHidden(key: string, on: boolean) {
  if (hidden.has(key) === on) return
  const next = new Set(hidden)
  if (on) next.add(key)
  else next.delete(key)
  hidden = next
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const emptySet: ReadonlySet<string> = new Set()

/** The keys of what is being deleted (or was), to leave out of a list. */
export function useDeletedKeys() {
  return React.useSyncExternalStore(subscribe, () => hidden, () => emptySet)
}

/**
 * Deletes still waiting on their undo, each committed at once should the app
 * go to the background: closed within the six seconds, it is still deleted,
 * as the toast said.
 */
const waiting = new Map<string, () => void>()
let flushing = false
function listenForHide() {
  if (flushing || typeof document === "undefined") return
  flushing = true
  const flush = () => {
    if (document.visibilityState === "hidden") [...waiting.values()].forEach((commit) => commit())
  }
  document.addEventListener("visibilitychange", flush)
  window.addEventListener("pagehide", () => [...waiting.values()].forEach((commit) => commit()))
}

type UndoableDeleteOptions = {
  description?: string
  errorMessage: string
  key: string
  onCommit: () => Promise<unknown>
  pendingMessage: string
  /** Left out when the first toast already said it is deleted. */
  successMessage?: string
  title: string
  undoMessage: string
}

export function scheduleUndoableDelete({
  description,
  errorMessage,
  key,
  onCommit,
  pendingMessage,
  successMessage,
  title,
  undoMessage,
}: UndoableDeleteOptions) {
  if (pendingDeletes.has(key)) {
    toast.info("Thao tác xoá này đang chờ xử lý.")
    return
  }

  pendingDeletes.add(key)
  listenForHide()
  let state: "pending" | "cancelled" | "committing" = "pending"
  let timeoutId = 0
  const hideId = window.setTimeout(() => {
    if (state !== "cancelled") setHidden(key, true)
  }, HIDE_DELAY_MS)

  const toastId = toast.warning(title, {
    description,
    duration: Infinity,
    action: {
      label: "Hoàn tác",
      onClick: () => {
        if (state !== "pending") return

        state = "cancelled"
        pendingDeletes.delete(key)
        waiting.delete(key)
        window.clearTimeout(timeoutId)
        window.clearTimeout(hideId)
        setHidden(key, false)
        toast.dismiss(toastId)
        toast.success(undoMessage)
      },
    },
  })

  const commit = async () => {
    if (state !== "pending") return

    state = "committing"
    waiting.delete(key)
    window.clearTimeout(timeoutId)
    toast.dismiss(toastId)
    const pendingToastId = toast.loading(pendingMessage, {
      duration: Infinity,
    })

    try {
      await onCommit()
      if (successMessage) toast.success(successMessage, { id: pendingToastId })
      else toast.dismiss(pendingToastId)
    } catch (error) {
      window.clearTimeout(hideId)
      setHidden(key, false)
      toast.error(actionErrorMessage(error, errorMessage), {
        id: pendingToastId,
        description: "Dữ liệu chưa bị xoá.",
      })
    } finally {
      pendingDeletes.delete(key)
    }
  }
  waiting.set(key, () => void commit())
  timeoutId = window.setTimeout(commit, UNDO_DELAY_MS)
}
