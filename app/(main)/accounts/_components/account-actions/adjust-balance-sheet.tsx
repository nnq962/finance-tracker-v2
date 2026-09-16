"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"

import { adjustAccountBalanceAction } from "../../actions"
import { AdjustBalanceForm } from "./adjust-balance-form"

type AdjustBalanceSheetProps = {
  account: Account
  categoryGroups: CategoryGroup[]
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function AdjustBalanceSheet({
  account,
  categoryGroups,
  onOpenChange,
  open,
}: AdjustBalanceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-md!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Điều chỉnh số dư</SheetTitle>
          <SheetDescription>
            Đối chiếu và cập nhật số dư thực tế của {account.name}.
          </SheetDescription>
        </SheetHeader>
        <AdjustBalanceForm
          action={adjustAccountBalanceAction.bind(null, account.id)}
          currentBalance={account.balance}
          categoryGroups={categoryGroups}
          onSuccess={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
