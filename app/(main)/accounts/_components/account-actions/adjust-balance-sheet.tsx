"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Account } from "../../_types/account"
import { AdjustBalanceForm } from "./adjust-balance-form"

type AdjustBalanceSheetProps = {
  account: Account
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function AdjustBalanceSheet({ account, onOpenChange, open }: AdjustBalanceSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="data-[side=right]:w-full sm:max-w-xl!"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>Điều chỉnh số dư</SheetTitle>
          <SheetDescription>
            Đối chiếu và cập nhật số dư thực tế của {account.name}.
          </SheetDescription>
        </SheetHeader>
        <AdjustBalanceForm
          currentBalance={account.balance}
          onSubmit={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
