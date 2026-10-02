"use client"

import * as React from "react"
import { CheckIcon, RotateCcwIcon } from "lucide-react"
import { AnimatePresence, motion, type Variants } from "motion/react"
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

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// The sentence comes in a phrase at a time, each out of a light blur.
const sentence: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07 } },
}
const phrase: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  shown: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.35, ease: EASE_OUT } },
}

type BlankProps = React.ComponentProps<"button"> & {
  /** Shown, softly marked as missing, while the blank has no value. */
  placeholder: string
  filled: boolean
  /** Changes with the value, so a new value slides in over the old. */
  valueKey: string
}

/**
 * One blank of the sentence: the filled-in word stands out from the muted
 * sentence with a light underline, and a soft background when hovered or
 * open; a missing one shows its question with a dashed amber underline.
 */
const Blank = React.forwardRef<HTMLButtonElement, BlankProps>(function Blank(
  { placeholder, filled, valueKey, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group/blank mx-0.5 inline rounded-md px-1 py-0.5 font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#38b8f6] data-[state=open]:bg-muted",
        !filled && "font-normal text-muted-foreground italic",
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={valueKey}
          // The underline sits on this word, as a box of its own does not
          // inherit the button's.
          className={cn(
            "inline-block underline decoration-foreground/25 decoration-1 underline-offset-[6px] transition-colors group-hover/blank:decoration-foreground/60",
            !filled && "decoration-[#f59e0b]/70 decoration-dashed",
          )}
          initial={{ opacity: 0, y: -6, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 6, filter: "blur(3px)" }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
        >
          {filled ? children : placeholder}
        </motion.span>
      </AnimatePresence>
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

  const complete =
    draft.amount !== null &&
    account !== undefined &&
    (draft.kind === "transfer"
      ? toAccount !== undefined && toAccount.id !== account.id
      : category !== undefined)

  const kindBlank = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Blank placeholder="" filled valueKey={draft.kind}>
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
        <Blank placeholder="bao nhiêu" filled={draft.amount !== null} valueKey={String(draft.amount)}>
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
        <Blank placeholder={placeholder} filled={value !== undefined} valueKey={value?.id ?? ""}>
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
        <Blank placeholder="hạng mục nào" filled={category !== undefined} valueKey={category?.id ?? ""}>
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
        <Blank placeholder="" filled valueKey={draft.date}>
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
        <Blank placeholder="nội dung gì" filled={draft.title.trim() !== ""} valueKey={draft.title.trim() ? "title" : ""}>
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
          {/* Loose leading leaves room for the blanks' underline and hover. */}
          <motion.p
            className="text-lg leading-[2.2] text-muted-foreground"
            variants={sentence}
            initial="hidden"
            animate="shown"
          >
            <motion.span variants={phrase}>{dateBlank}, bạn đã </motion.span>
            <motion.span variants={phrase}>{kindBlank} {amountBlank} </motion.span>
            {draft.kind === "transfer" ? (
              <motion.span variants={phrase}>
                từ {accountBlank("accountId", account, "tài khoản nào")} sang{" "}
                {accountBlank("toAccountId", toAccount, "tài khoản nào")}
              </motion.span>
            ) : (
              <>
                <motion.span variants={phrase}>
                  {draft.kind === "expense" ? "cho" : "từ"} {categoryBlank}{" "}
                </motion.span>
                <motion.span variants={phrase}>
                  {draft.kind === "expense" ? "từ" : "vào"} {accountBlank("accountId", account, "tài khoản nào")}
                </motion.span>
              </>
            )}
            <motion.span variants={phrase}>, ghi là {titleBlank}.</motion.span>
          </motion.p>
        </CardContent>
      </Card>

      <motion.p
        className="px-3 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
      >
        {complete ? "Bấm vào từ được gạch chân để sửa." : "Điền các ô còn trống trước khi lưu."}
      </motion.p>

      <motion.div
        className="grid grid-cols-2 gap-2"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.5 }}
      >
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
      </motion.div>
    </div>
  )
}
