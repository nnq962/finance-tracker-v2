"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function SonnerExamples() {
  const showPromiseToast = () => {
    toast.promise(
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1500)
      }),
      {
        loading: "Đang đồng bộ dữ liệu…",
        success: "Đồng bộ dữ liệu thành công.",
        error: "Không thể đồng bộ dữ liệu.",
      },
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => toast("Đây là thông báo mặc định.")}
      >
        Mặc định
      </Button>
      <Button
        type="button"
        onClick={() => toast.success("Đã lưu thay đổi.")}
      >
        Thành công
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => toast.info("Bạn có một cập nhật mới.")}
      >
        Thông tin
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => toast.warning("Số dư tài khoản sắp hết.")}
      >
        Cảnh báo
      </Button>
      <Button
        type="button"
        variant="destructive"
        onClick={() => toast.error("Không thể lưu giao dịch.")}
      >
        Lỗi
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => toast.loading("Đang xử lý…", { duration: 3000 })}
      >
        Loading
      </Button>
      <Button type="button" variant="secondary" onClick={showPromiseToast}>
        Promise
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          toast("Đã xoá giao dịch.", {
            description: "Giao dịch sẽ được xoá khỏi lịch sử.",
            action: {
              label: "Hoàn tác",
              onClick: () => toast.success("Đã khôi phục giao dịch."),
            },
          })
        }
      >
        Có thao tác
      </Button>
    </div>
  )
}
