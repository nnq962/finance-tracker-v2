"use client"

import * as React from "react"
import {
  CircleDollarSignIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { Account } from "../../_types/account"
import { AdjustBalanceSheet } from "./adjust-balance-sheet"
import { DeleteAccountAlert } from "./delete-account-alert"
import { EditAccountSheet } from "./edit-account-sheet"

type AccountActionsMenuProps = {
  account: Account
  isLocked: boolean
  onLockedChange: (isLocked: boolean) => void
}

export function AccountActionsMenu({
  account,
  isLocked,
  onLockedChange,
}: AccountActionsMenuProps) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [adjustBalanceOpen, setAdjustBalanceOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Mở menu tài khoản ${account.name}`}
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAdjustBalanceOpen(true)}>
              <CircleDollarSignIcon />
              Điều chỉnh số dư
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onLockedChange(!isLocked)}>
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
