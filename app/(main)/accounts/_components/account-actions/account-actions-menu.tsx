"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CircleDollarSignIcon,
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
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { setAccountArchivedAction } from "../../actions"
import { AdjustBalanceSheet } from "./adjust-balance-sheet"
import { DeleteAccountAlert } from "./delete-account-alert"
import { EditAccountSheet } from "./edit-account-sheet"

type AccountActionsMenuProps = {
  account: Account
  categoryGroups: CategoryGroup[]
}

export function AccountActionsMenu({
  account,
  categoryGroups,
}: AccountActionsMenuProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [editOpen, setEditOpen] = React.useState(false)
  const [adjustBalanceOpen, setAdjustBalanceOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label={`Mở menu tài khoản ${account.name}`}
          >
            <EllipsisIcon />
          </Button>
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
            <DropdownMenuItem
              disabled={isLocked}
              onSelect={() => setAdjustBalanceOpen(true)}
            >
              <CircleDollarSignIcon />
              Điều chỉnh số dư
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

      <EditAccountSheet
        account={account}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AdjustBalanceSheet
        account={account}
        categoryGroups={categoryGroups}
        open={adjustBalanceOpen}
        onOpenChange={setAdjustBalanceOpen}
      />
      <DeleteAccountAlert
        account={account}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
