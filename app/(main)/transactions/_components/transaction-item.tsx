"use client"

import * as React from "react"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  HandshakeIcon,
  LoaderCircleIcon,
  PencilIcon,
  Repeat2Icon,
  Trash2Icon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"

import { deleteTransactionAction } from "../actions"
import type { Transaction, TransactionKind } from "../_types/transaction"
import { EditTransactionSheet } from "./edit-transaction-sheet"

const kindPresentation: Record<
  TransactionKind,
  {
    icon: typeof ArrowUpRightIcon
    iconClassName: string
    amountClassName: string
  }
> = {
  expense: {
    icon: ArrowUpRightIcon,
    iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    amountClassName: "text-rose-600 dark:text-rose-400",
  },
  income: {
    icon: ArrowDownLeftIcon,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amountClassName: "text-emerald-600 dark:text-emerald-400",
  },
  transfer: {
    icon: Repeat2Icon,
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amountClassName: "text-blue-600 dark:text-blue-400",
  },
  loan: {
    icon: HandshakeIcon,
    iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    amountClassName: "text-amber-600 dark:text-amber-400",
  },
}

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
})

type TransactionItemProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  transaction: Transaction
}

export function TransactionItem({
  accounts,
  categoryGroups,
  transaction,
}: TransactionItemProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false)
  const [isDeleteRevealed, setIsDeleteRevealed] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const itemRef = React.useRef<HTMLElement>(null)
  const swipeStartRef = React.useRef<{ x: number; y: number } | null>(null)
  const presentation = kindPresentation[transaction.kind]
  const Icon = presentation.icon
  const signDisplay = transaction.kind === "transfer" ? "never" : "always"

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteTransactionAction(transaction.id)

        if (result.success) {
          toast.success("Đã xoá giao dịch.")
          router.refresh()
          return
        }

        setIsConfirmingDelete(false)
        toast.error(result.error)
      } catch {
        setIsConfirmingDelete(false)
        toast.error("Không thể xoá giao dịch. Vui lòng thử lại.")
      }
    })
  }

  React.useEffect(() => {
    if (!isDeleteRevealed) return

    const closeDeleteAction = (event: PointerEvent) => {
      if (!itemRef.current?.contains(event.target as Node)) {
        setIsDeleteRevealed(false)
      }
    }

    document.addEventListener("pointerdown", closeDeleteAction)
    return () => document.removeEventListener("pointerdown", closeDeleteAction)
  }, [isDeleteRevealed])

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return

    swipeStartRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const swipeStart = swipeStartRef.current
    swipeStartRef.current = null

    if (!swipeStart || event.pointerType === "mouse") return

    const distanceX = event.clientX - swipeStart.x
    const distanceY = event.clientY - swipeStart.y

    if (Math.abs(distanceX) < 32 || Math.abs(distanceX) <= Math.abs(distanceY)) {
      return
    }

    setIsDeleteRevealed(distanceX < 0)
  }

  return (
    <>
    <article
      ref={itemRef}
      className="group/transaction flex touch-pan-y items-center gap-3 py-3.5 sm:gap-4"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStartRef.current = null
      }}
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg sm:size-12 ${presentation.iconClassName}`}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium sm:text-base">
          {transaction.title}
        </h3>
        <p className="truncate text-sm text-muted-foreground">
          {transaction.description}
        </p>
      </div>
      {isConfirmingDelete ? (
        <div className="shrink-0 animate-in fade-in slide-in-from-right-2 motion-reduce:animate-none">
          <ButtonGroup aria-label={`Xác nhận xóa ${transaction.title}`}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setIsConfirmingDelete(false)}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? <LoaderCircleIcon className="animate-spin" /> : null}
              {isPending ? "Đang xoá..." : "Xoá"}
            </Button>
          </ButtonGroup>
        </div>
      ) : (
        <div className="relative flex shrink-0 items-center justify-end">
          <div
            className={`text-right transition-transform duration-200 ease-out motion-reduce:transition-none group-hover/transaction:-translate-x-20 group-focus-within/transaction:-translate-x-20 ${
              isDeleteRevealed
                ? "[@media(hover:none)]:-translate-x-20"
                : "[@media(hover:none)]:translate-x-0"
            }`}
          >
            <p
              className={`text-sm font-semibold tabular-nums sm:text-base ${presentation.amountClassName}`}
            >
              {formatCurrency(transaction.amount, { signDisplay })}
            </p>
            <time
              className="text-xs text-muted-foreground"
              dateTime={transaction.occurredAt}
            >
              {timeFormatter.format(new Date(transaction.occurredAt))}
            </time>
          </div>
          <div
            className={`pointer-events-none absolute right-0 translate-x-2 opacity-0 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none group-hover/transaction:pointer-events-auto group-hover/transaction:translate-x-0 group-hover/transaction:opacity-100 group-focus-within/transaction:pointer-events-auto group-focus-within/transaction:translate-x-0 group-focus-within/transaction:opacity-100 ${
              isDeleteRevealed
                ? "[@media(hover:none)]:pointer-events-auto [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100"
                : "[@media(hover:none)]:pointer-events-none [@media(hover:none)]:translate-x-2 [@media(hover:none)]:opacity-0"
            }`}
          >
            <ButtonGroup>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Chỉnh sửa giao dịch ${transaction.title}`}
                onClick={() => {
                  setIsDeleteRevealed(false)
                  setEditOpen(true)
                }}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                aria-label={`Xóa giao dịch ${transaction.title}`}
                onClick={() => {
                  setIsDeleteRevealed(false)
                  setIsConfirmingDelete(true)
                }}
              >
                <Trash2Icon />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )}
    </article>
      <EditTransactionSheet
        accounts={accounts}
        categoryGroups={categoryGroups}
        transaction={transaction}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
