import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"

import { AccountDialogContent } from "./account-dialog-content"
import { BillingDialogContent } from "./billing-dialog-content"
import {
  NotificationDialogContent,
  type NotificationSettings,
} from "./notification-dialog-content"
import { UpgradeDialogContent } from "./upgrade-dialog-content"

export type UserMenuDialogType =
  | "upgrade"
  | "account"
  | "billing"
  | "notifications"
  | null

type UserMenuDialogProps = {
  activeDialog: UserMenuDialogType
  onActiveDialogChange: (dialog: UserMenuDialogType) => void
  name: string
  onNameChange: (name: string) => void
  notificationSettings: NotificationSettings
  onNotificationSettingsChange: (settings: NotificationSettings) => void
}

const dialogCopy = {
  upgrade: {
    title: "Nâng cấp tài khoản",
    description: "Chọn gói phù hợp với nhu cầu quản lý tài chính của bạn.",
  },
  account: {
    title: "Tài khoản",
    description: "Quản lý hồ sơ và thông tin tài khoản.",
  },
  billing: {
    title: "Thanh toán",
    description: "Quản lý gói dịch vụ và lịch sử thanh toán.",
  },
  notifications: {
    title: "Thông báo",
    description: "Chọn những cập nhật và lời nhắc bạn muốn nhận.",
  },
} as const

export function UserMenuDialog({
  activeDialog,
  onActiveDialogChange,
  name,
  onNameChange,
  notificationSettings,
  onNotificationSettingsChange,
}: UserMenuDialogProps) {
  const copy = activeDialog ? dialogCopy[activeDialog] : null

  return (
    <Dialog
      open={activeDialog !== null}
      onOpenChange={(open) => {
        if (!open) onActiveDialogChange(null)
      }}
    >
      <DialogContent
        className={
          activeDialog === "upgrade"
            ? "max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-4xl"
            : activeDialog === "account" ||
                activeDialog === "billing" ||
                activeDialog === "notifications"
              ? "max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"
              : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.description}</DialogDescription>
        </DialogHeader>

        {activeDialog === "upgrade" && <UpgradeDialogContent />}
        {activeDialog === "account" && (
          <AccountDialogContent
            name={name}
            onSaveName={(nextName) => {
              onNameChange(nextName)
              onActiveDialogChange(null)
            }}
          />
        )}
        {activeDialog === "billing" && (
          <BillingDialogContent
            onShowPlans={() => onActiveDialogChange("upgrade")}
          />
        )}
        {activeDialog === "notifications" && (
          <NotificationDialogContent
            settings={notificationSettings}
            onSettingsChange={onNotificationSettingsChange}
            onSave={() => onActiveDialogChange(null)}
          />
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Đóng
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
