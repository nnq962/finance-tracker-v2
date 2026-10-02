"use client"

import * as React from "react"
import { CheckIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Account } from "@/lib/accounts/types"
import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"
import { cn } from "@/lib/utils"

import type { AiTransactionDraft } from "../../_lib/mock-ai-parse"
import type { TransactionKind } from "../../_types/transaction"

const kindWords: Record<TransactionKind, string> = {
  expense: "chi",
  income: "nhận",
  transfer: "chuyển",
}

const kindColors: Record<TransactionKind, CategoryColorName> = {
  expense: "rose",
  income: "emerald",
  transfer: "blue",
}

type BlankProps = React.ComponentProps<"button"> & {
  color: CategoryColorName
  /** Shown, and highlighted as missing, while the blank has no value. */
  placeholder: string
  filled: boolean
}

/**
 * One blank of the sentence: the word the assistant filled in, tinted and
 * underlined so it reads as tappable; a missing one asks to be chosen.
 */
const Blank = React.forwardRef<HTMLButtonElement, BlankProps>(function Blank(
  { color, placeholder, filled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "mx-0.5 inline rounded-md px-1.5 py-0.5 font-heading font-extrabold underline decoration-dashed decoration-2 underline-offset-4 outline-none [box-decoration-break:clone] focus-visible:ring-2 focus-visible:ring-[#38b8f6]",
        getCategoryColor(filled ? color : "rose").surfaceClassName,
        !filled && "animate-pulse",
        className,
      )}
      {...props}
    >
      {filled ? children : placeholder}
    </button>
  )
})

type TransactionMadLibsProps = {
  draft: AiTransactionDraft
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  today: string
  onRetry: () => void
  onDone: () => void
}

/**
 * What the assistant understood, as a sentence with blanks to check: each
 * blank opens a picker to correct it before saving.
 */
export function TransactionMadLibs({
  draft: initialDraft,
  accounts,
  categoryGroups,
  today,
  onRetry,
  onDone,
}: TransactionMadLibsProps) {
  const [draft, setDraft] = React.useState(initialDraft)
  const update = (values: Partial<AiTransactionDraft>) =>
    setDraft((current) => ({ ...current, ...values }))

  const activeAccounts = accounts.filter((account) => account.status === "active")
  const account = activeAccounts.find((item) => item.id === draft.accountId)
  const toAccount = activeAccounts.find((item) => item.id === draft.toAccountId)
  const groups = categoryGroups.filter((group) => group.type === draft.kind)
  const category = groups.flatMap((group) => group.items).find((item) => item.id === draft.categoryId)
  const categoryGroup = groups.find((group) => group.id === category?.groupId)

  const complete =
    draft.amount !== null &&
    account !== undefined &&
    (draft.kind === "transfer"
      ? toAccount !== undefined && toAccount.id !== account.id
      : category !== undefined)

  const kindBlank = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Blank color={kindColors[draft.kind]} placeholder="" filled>
          {kindWords[draft.kind]}
        </Blank>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto min-w-40">
        <DropdownMenuRadioGroup
          value={draft.kind}
          onValueChange={(kind) =>
            // A category of the other kind no longer fits.
            update({ kind: kind as TransactionKind, categoryId: undefined, toAccountId: undefined })
          }
        >
          <DropdownMenuRadioItem value="expense">Chi tiền</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="income">Thu tiền</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="transfer">Chuyển khoản</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const amountBlank = (
    <Popover>
      <PopoverTrigger asChild>
        <Blank color={kindColors[draft.kind]} placeholder="bao nhiêu" filled={draft.amount !== null}>
          {formatCurrency(draft.amount ?? 0)}
        </Blank>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <Field>
          <FieldLabel htmlFor="ai-amount">Số tiền</FieldLabel>
          <CurrencyInput
            id="ai-amount"
            name="amount"
            value={draft.amount}
            onValueChange={(amount) => update({ amount })}
          />
        </Field>
      </PopoverContent>
    </Popover>
  )

  const accountBlank = (field: "accountId" | "toAccountId", value: Account | undefined, placeholder: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Blank color="blue" placeholder={placeholder} filled={value !== undefined}>
          {value?.name}
        </Blank>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto min-w-48">
        <DropdownMenuRadioGroup value={value?.id ?? ""} onValueChange={(id) => update({ [field]: id })}>
          {activeAccounts.map((item) => (
            <DropdownMenuRadioItem key={item.id} value={item.id}>
              {item.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const categoryBlank = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Blank
          color={categoryGroup?.colorName ?? "violet"}
          placeholder="hạng mục nào"
          filled={category !== undefined}
        >
          {category?.name}
        </Blank>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto max-h-72 min-w-52">
        <DropdownMenuRadioGroup value={draft.categoryId ?? ""} onValueChange={(categoryId) => update({ categoryId })}>
          {groups.map((group) => (
            <DropdownMenuGroup key={group.id}>
              <DropdownMenuLabel>{group.name}</DropdownMenuLabel>
              {group.items.map((item) => (
                <DropdownMenuRadioItem key={item.id} value={item.id}>
                  {item.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const dateBlank = (
    <Popover>
      <PopoverTrigger asChild>
        <Blank color="amber" placeholder="" filled>
          {formatDayLabel(draft.date, today)}
        </Blank>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <Field>
          <FieldLabel htmlFor="ai-date">Ngày</FieldLabel>
          <Input
            id="ai-date"
            type="date"
            max={today}
            value={draft.date}
            onChange={(event) => event.target.value && update({ date: event.target.value })}
          />
        </Field>
      </PopoverContent>
    </Popover>
  )

  const titleBlank = (
    <Popover>
      <PopoverTrigger asChild>
        <Blank color="slate" placeholder="nội dung gì" filled={draft.title.trim() !== ""}>
          {draft.title}
        </Blank>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <Field>
          <FieldLabel htmlFor="ai-title">Nội dung</FieldLabel>
          <Input
            id="ai-title"
            value={draft.title}
            maxLength={100}
            onChange={(event) => update({ title: event.target.value })}
          />
        </Field>
      </PopoverContent>
    </Popover>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          {/* Loose leading leaves room for the blanks' tint and underline. */}
          <p className="text-lg leading-[2.4]">
            {dateBlank}, bạn đã {kindBlank} {amountBlank}{" "}
            {draft.kind === "expense" ? (
              <>cho {categoryBlank} từ {accountBlank("accountId", account, "tài khoản nào")}</>
            ) : draft.kind === "income" ? (
              <>từ {categoryBlank} vào {accountBlank("accountId", account, "tài khoản nào")}</>
            ) : (
              <>
                từ {accountBlank("accountId", account, "tài khoản nào")} sang{" "}
                {accountBlank("toAccountId", toAccount, "tài khoản nào")}
              </>
            )}
            , ghi là {titleBlank}.
          </p>
        </CardContent>
      </Card>

      <p className="px-3 text-xs text-muted-foreground">
        {complete ? "Bấm vào từ được tô màu để sửa." : "Điền các ô còn trống trước khi lưu."}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCcwIcon />
          Nói lại
        </Button>
        <Button
          type="button"
          disabled={!complete}
          onClick={() => {
            toast.info("Bản xem trước: chưa lưu giao dịch.")
            onDone()
          }}
        >
          <CheckIcon />
          Lưu
        </Button>
      </div>
    </div>
  )
}
