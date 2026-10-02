"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CirclePauseIcon,
  CirclePlayIcon,
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import type { Account } from "@/lib/accounts/types"

import { setAccountArchivedAction } from "../../actions"
import { DeleteAccountAlert } from "./delete-account-alert"
import { EditAccountSheet } from "./edit-account-sheet"

type AccountActionsMenuProps = {
  account: Account
  trigger?: React.ReactElement
  presentation?: "dropdown" | "drawer"
}

export function AccountActionsMenu({
  account,
  trigger,
  presentation = "dropdown",
}: AccountActionsMenuProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const pendingDrawerAction = React.useRef<(() => void) | null>(null)
  const queueDrawerAction = (action: () => void) => {
    pendingDrawerAction.current = action
  }
  const isLocked = account.status === "archived"

  const handleArchivedChange = () => {
    startTransition(async () => {
      try {
        const result = await setAccountArchivedAction(account.id, !isLocked)

        if (result.success) {
          toast.success(
            isLocked
              ? "Đã kích hoạt lại tài khoản."
              : "Đã ngừng sử dụng tài khoản.",
          )
          router.refresh()
          return
        }

        toast.error(result.error)
      } catch {
        toast.error("Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.")
      }
    })
  }

  return (
    <>
      {presentation === "drawer" ? (
        <Drawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onAnimationEnd={(open) => {
            if (!open) {
              const action = pendingDrawerAction.current
              pendingDrawerAction.current = null
              action?.()
            }
          }}
          direction="bottom"
        >
          <DrawerTrigger
            asChild
            disabled={isPending}
            aria-label={`Mở menu tài khoản ${account.name}`}
          >
            {trigger ?? (
              <Button variant="ghost" size="icon">
                <EllipsisIcon />
              </Button>
            )}
          </DrawerTrigger>
          <DrawerContent
            onCloseAutoFocus={(event) => {
              if (pendingDrawerAction.current) {
                event.preventDefault()
              }
            }}
          >
            <DrawerHeader>
              <DrawerTitle>{account.name}</DrawerTitle>
              <DrawerDescription>Chọn thao tác với tài khoản này.</DrawerDescription>
            </DrawerHeader>
            <div className="grid gap-3 overflow-y-auto p-4">
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="justify-start"
                  disabled={isLocked || isPending}
                  onClick={() => queueDrawerAction(() => setEditOpen(true))}
                >
                  <PencilIcon />Chỉnh sửa
                </Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="justify-start"
                  disabled={isPending}
                  onClick={() => queueDrawerAction(handleArchivedChange)}
                >
                  {isLocked ? <CirclePlayIcon /> : <CirclePauseIcon />}
                  {isLocked ? "Tiếp tục sử dụng" : "Ngừng sử dụng"}
                </Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="justify-start text-[#c8393a] dark:text-[#ff9b93]"
                  disabled={isPending}
                  onClick={() => queueDrawerAction(() => setDeleteOpen(true))}
                >
                  <Trash2Icon />Xoá tài khoản
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isPending} aria-label={`Mở menu tài khoản ${account.name}`}>
          {trigger ?? <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label={`Mở menu tài khoản ${account.name}`}
          >
            <EllipsisIcon />
          </Button>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={isLocked}
              onSelect={() => setEditOpen(true)}
            >
              <PencilIcon />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleArchivedChange}>
              {isLocked ? <CirclePlayIcon /> : <CirclePauseIcon />}
              {isLocked ? "Tiếp tục sử dụng" : "Ngừng sử dụng"}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2Icon />
              Xoá
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      )}

      <EditAccountSheet
        account={account}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteAccountAlert
        account={account}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
