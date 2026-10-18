import type { Metadata } from "next"

import { StatusBackButton, StatusHomeButton, StatusScreen } from "@/components/app/status-screen"

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
}

/** Any address the app has no page for (2026-10-18, chosen over a large "404"). */
export default function NotFound() {
  return (
    <StatusScreen title="Không tìm thấy trang" description="Đường dẫn có thể đã cũ, hoặc trang này không còn nữa.">
      <StatusHomeButton />
      <StatusBackButton />
    </StatusScreen>
  )
}
