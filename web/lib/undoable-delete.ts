"use client"

import { toast } from "sonner"

const UNDO_DELAY_MS = 6000
const pendingDeletes = new Set<string>()

type UndoableDeleteOptions = {
  description: string
  errorMessage: string
  key: string
  onCommit: () => Promise<void>
  pendingMessage: string
  successMessage: string
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
  let state: "pending" | "cancelled" | "committing" = "pending"
  let timeoutId = 0

  const toastId = toast.warning(title, {
    description,
    duration: Infinity,
    action: {
      label: "Hoàn tác",
      onClick: () => {
        if (state !== "pending") return

        state = "cancelled"
        pendingDeletes.delete(key)
        window.clearTimeout(timeoutId)
        toast.dismiss(toastId)
        toast.success(undoMessage)
      },
    },
  })

  timeoutId = window.setTimeout(async () => {
    if (state !== "pending") return

    state = "committing"
    toast.dismiss(toastId)
    const pendingToastId = toast.loading(pendingMessage, {
      duration: Infinity,
    })

    try {
      await onCommit()
      toast.success(successMessage, { id: pendingToastId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage, {
        id: pendingToastId,
        description: "Dữ liệu chưa bị xoá.",
      })
    } finally {
      pendingDeletes.delete(key)
    }
  }, UNDO_DELAY_MS)
}
