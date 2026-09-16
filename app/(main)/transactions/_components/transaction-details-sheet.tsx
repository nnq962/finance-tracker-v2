"use client"

import * as React from "react"
import { LoaderCircleIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/animate-ui/components/radix/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryItem } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"

import { deleteTransactionAction } from "../actions"
import { transactionPresentation } from "../_lib/transaction-presentation"
import type { Transaction } from "../_types/transaction"

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
})

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Ho_Chi_Minh",
})

type DetailRowProps = {
  label: string
  value: string
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

type TransactionDetailsSheetProps = {
  category?: CategoryItem
  onDeleted: () => void
  onEdit: () => void
  transaction: Transaction
}

export function TransactionDetailsSheet({
  category,
  onDeleted,
  onEdit,
  transaction,
}: TransactionDetailsSheetProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, startDeleteTransition] = React.useTransition()
  const presentation = transactionPresentation[transaction.kind]
  const Icon = category
    ? categoryIconRegistry[category.iconName]
    : presentation.icon
  const categoryColor = category
    ? getCategoryColor(category.colorName)
    : undefined
  const occurredAt = new Date(transaction.occurredAt)
  const details =
    transaction.kind === "transfer"
      ? [
          {
            label: "Từ tài khoản",
            value: transaction.fromAccountName ?? "Không xác định",
          },
          {
            label: "Đến tài khoản",
            value: transaction.toAccountName ?? "Không xác định",
          },
          {
            label: "Phí chuyển khoản",
            value: formatCurrency(transaction.fee ?? 0, {
              signDisplay: "never",
            }),
          },
        ]
      : [
          {
            label: "Tài khoản",
            value: transaction.accountName ?? "Không xác định",
          },
          {
            label: "Nhóm hạng mục",
            value: transaction.categoryGroupName ?? "Không xác định",
          },
          {
            label: "Hạng mục",
            value: transaction.categoryName ?? "Không xác định",
          },
        ]

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        const result = await deleteTransactionAction(transaction.id)

        if (result.success) {
          setDeleteOpen(false)
          onDeleted()
          toast.success("Đã xoá giao dịch.")
          router.refresh()
          return
        }

        toast.error(result.error)
      } catch {
        toast.error("Không thể xoá giao dịch. Vui lòng thử lại.")
      }
    })
  }

  return (
    <SheetContent className="data-[side=right]:w-full sm:max-w-md!">
      <SheetHeader>
        <SheetTitle>Chi tiết giao dịch</SheetTitle>
        <SheetDescription>
          Thông tin đầy đủ của giao dịch đã ghi nhận.
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col items-center pb-4 text-center">
          <div
            className={`flex size-16 items-center justify-center rounded-xl ${categoryColor?.surfaceClassName ?? presentation.iconClassName}`}
          >
            <Icon className="size-7" aria-hidden="true" />
          </div>
          <p
            className={`mt-5 text-[2rem] font-semibold tracking-tight tabular-nums ${presentation.amountClassName}`}
          >
            {formatCurrency(Math.abs(transaction.amount), {
              signDisplay: "never",
            })}
          </p>
          <p className="mt-3 text-base font-semibold">{transaction.title}</p>
          <time
            className="mt-1 text-sm text-muted-foreground"
            dateTime={transaction.occurredAt}
          >
            {dateFormatter.format(occurredAt)} · {timeFormatter.format(occurredAt)}
          </time>
        </div>

        <Separator />

        <dl className="space-y-4 text-sm">
          <DetailRow
            label="Loại giao dịch"
            value={presentation.label}
          />
          {details.map((detail) => (
            <DetailRow
              key={detail.label}
              label={detail.label}
              value={detail.value}
            />
          ))}
        </dl>

        <Separator />

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">Ghi chú</p>
          <p className="whitespace-pre-wrap">
            {transaction.note || "Không có ghi chú."}
          </p>
        </div>
      </div>

      <SheetFooter>
        <div className="grid grid-cols-2 gap-2">
          <Popover
            open={deleteOpen}
            onOpenChange={(open) => {
              if (!isDeleting) setDeleteOpen(open)
            }}
          >
            <PopoverTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2Icon />
                Xoá giao dịch
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Xoá giao dịch?</p>
                <p className="text-xs text-muted-foreground">
                  Giao dịch “{transaction.title}” sẽ bị xoá và số dư liên quan
                  được đối soát lại. Thao tác này không thể hoàn tác.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <PopoverClose asChild>
                  <Button type="button" variant="outline" size="sm">
                    Huỷ
                  </Button>
                </PopoverClose>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? (
                    <LoaderCircleIcon className="animate-spin" />
                  ) : (
                    <Trash2Icon />
                  )}
                  {isDeleting ? "Đang xoá..." : "Xoá giao dịch"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button type="button" onClick={onEdit}>
            <PencilIcon />
            Sửa giao dịch
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  )
}
