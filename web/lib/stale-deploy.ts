import { unstable_isUnrecognizedActionError } from "next/navigation"
import { toast } from "sonner"

/**
 * A page loaded before a deploy still calls Server Actions by the previous
 * build's ids. The new server rejects them without running anything, and
 * only a reload fixes it.
 */
export const isStaleDeployError = unstable_isUnrecognizedActionError

export const STALE_DEPLOY_MESSAGE = "Ứng dụng vừa được cập nhật. Hãy tải lại trang rồi thử lại."

/** What to show when a Server Action call throws. */
export function actionErrorMessage(error: unknown, fallback: string) {
  if (isStaleDeployError(error)) return STALE_DEPLOY_MESSAGE
  return error instanceof Error ? error.message : fallback
}

/** Stays until dismissed or reloaded: an installed app has no reload button. */
export function showStaleDeployToast() {
  toast("Ứng dụng vừa được cập nhật", {
    id: "stale-deploy",
    description: "Tải lại để dùng bản mới.",
    duration: Infinity,
    action: { label: "Tải lại", onClick: () => window.location.reload() },
  })
}
