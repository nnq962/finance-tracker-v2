"use client"

import * as React from "react"
import { PlusIcon, WalletCardsIcon } from "lucide-react"

import { AddAccountSheet } from "@/app/(main)/budget/_components/add-account/add-account-sheet"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/**
 * Shown in place of a transaction form while the user has no account: every
 * transaction moves money in or out of one. The account is added in a sheet
 * on top, and the form appears once the page reloads with it.
 */
export function NeedAccountState({
  title = "Cần có tài khoản trước",
  description = "Mỗi giao dịch đều ghi vào một tài khoản: tiền mặt, ngân hàng hoặc ví điện tử. Thêm tài khoản đầu tiên để bắt đầu ghi chép.",
}: {
  title?: string
  description?: string
}) {
  const [addAccountOpen, setAddAccountOpen] = React.useState(false)

  return (
    <>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletCardsIcon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" onClick={() => setAddAccountOpen(true)}>
            <PlusIcon />
            Thêm tài khoản
          </Button>
        </EmptyContent>
      </Empty>
      {/* The sheet is portalled but its events still bubble through React:
          its submit must not reach a transaction form this sits in. */}
      <div className="contents" onSubmit={(event) => event.stopPropagation()}>
        <AddAccountSheet open={addAccountOpen} onOpenChange={setAddAccountOpen} />
      </div>
    </>
  )
}
