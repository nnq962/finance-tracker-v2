"use client"

import {
  CircleDollarSignIcon,
  CirclePauseIcon,
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/format-currency"

import type { Account } from "../_types/account"

type AccountCardProps = {
  account: Account
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={account.logoUrl} alt={account.name} />
            <AvatarFallback>{account.logoFallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <CardTitle>{account.name}</CardTitle>
            <CardDescription>Tài khoản chi tiêu</CardDescription>
          </div>
        </div>
        <CardAction>
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
                <DropdownMenuItem>
                  <PencilIcon />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CircleDollarSignIcon />
                  Điều chỉnh số dư
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CirclePauseIcon />
                  Ngừng sử dụng
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <Trash2Icon />
                  Xoá
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(account.balance)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
