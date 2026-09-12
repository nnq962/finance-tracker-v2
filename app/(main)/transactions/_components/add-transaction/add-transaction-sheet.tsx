"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/animate-ui/components/buttons/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import type { TransactionKind } from "../../_types/transaction"
import { TransactionForm } from "./transaction-form"
import { TransactionKindSelector } from "./transaction-kind-selector"

export function AddTransactionSheet() {
  const [open, setOpen] = React.useState(false)
  const [kind, setKind] = React.useState<TransactionKind>("expense")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" size="lg">
          <PlusIcon />
          Thêm giao dịch
        </Button>
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-full sm:max-w-xl!">
        <SheetHeader>
          <SheetTitle>Thêm giao dịch</SheetTitle>
          <SheetDescription>
            Chọn loại và nhập thông tin cho giao dịch mới.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <TransactionKindSelector value={kind} onValueChange={setKind} />
        </div>
        <TransactionForm kind={kind} onSubmit={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
