"use client"

import * as React from "react"
import { CalendarIcon, CheckIcon, RotateCcwIcon } from "lucide-react"
import { AnimatePresence, motion, type Variants } from "motion/react"
import { toast } from "sonner"

import { AmountSuggestions } from "@/components/forms/amount-suggestions"
import { CurrencyInput } from "@/components/forms/currency-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Account } from "@/lib/accounts/types"
import { getAmountSuggestions } from "@/lib/amount-suggestions"
import { getCategoryColor } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDayLabel } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { shiftDate, type AiTransactionDraft } from "../../_lib/ai-transaction-draft"
import type { TransactionKind } from "../../_types/transaction"
import { TransactionKindSelector } from "../add-transaction/transaction-kind-selector"

const kindWords: Record<TransactionKind, string> = {
  expense: "chi",
  income: "nhận",
  transfer: "chuyển",
}

type BlankField = "kind" | "amount" | "date" | "category" | "accountId" | "toAccountId" | "title"

const fieldCaptions: Record<BlankField, string> = {
  kind: "Loại giao dịch",
  amount: "Số tiền",
  date: "Ngày",
  category: "Hạng mục",
  accountId: "Tài khoản",
  toAccountId: "Tài khoản nhận",
  title: "Nội dung",
}

const EDITOR_ID = "ai-blank-editor"

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

// The area under the sentence swaps between the actions and an editor.
const panelMotion = {
  initial: { opacity: 0, y: -6, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: 6, filter: "blur(3px)" },
}

type BlankProps = React.ComponentProps<"button"> & {
  /** Shown, softly marked as missing, while the blank has no value. */
  placeholder: string
  filled: boolean
  /** Its editor is open below the sentence. */
  active: boolean
  /** Changes with the value, so a new value slides in over the old. */
  valueKey: string
}

/**
 * One blank of the sentence: the filled-in word stands out from the muted
 * sentence with a light underline, and a soft background when hovered or
 * being edited; a missing one shows its question with a dashed amber
 * underline.
 */
function Blank({ placeholder, filled, active, valueKey, className, children, ...props }: BlankProps) {
  return (
    <button
      type="button"
      aria-expanded={active}
      aria-controls={active ? EDITOR_ID : undefined}
      className={cn(
        // The padding gives the background room; the negative margin
        // keeps it out of the spacing, so no gap shows before a comma.
        "group/blank -mx-1 inline rounded-md px-1 py-0.5 font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-[#38b8f6] aria-expanded:bg-muted",
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
            "inline-block underline decoration-foreground/25 decoration-1 underline-offset-[6px] transition-colors group-hover/blank:decoration-foreground/60 group-aria-expanded/blank:decoration-[#38b8f6]",
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
}

type TransactionMadLibsProps = {
  draft: AiTransactionDraft
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  today: string
  onRetry: () => void
  onDone: () => void
}

/**
 * What the assistant understood, as a sentence with blanks to check. A
 * blank opens its editor in place of the actions below the sentence; a pick
 * moves on to the next blank still missing, or back to the actions.
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
  const [editing, setEditing] = React.useState<BlankField | null>(null)
  // The actions wait for the sentence only the first time they show.
  const [edited, setEdited] = React.useState(false)
  const advanceTimer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const activeAccounts = accounts.filter((account) => account.status === "active")
  const findAccount = (id: string | undefined) => activeAccounts.find((item) => item.id === id)
  const account = findAccount(draft.accountId)
  const toAccount = findAccount(draft.toAccountId)
  const groups = categoryGroups.filter((group) => group.type === draft.kind && group.items.length > 0)
  const category = groups.flatMap((group) => group.items).find((item) => item.id === draft.categoryId)

  /** The first blank, in reading order, still needed to save. */
  const firstMissing = (next: AiTransactionDraft): BlankField | null => {
    if (next.amount === null) return "amount"
    if (next.kind === "transfer") {
      if (!findAccount(next.accountId)) return "accountId"
      if (!findAccount(next.toAccountId) || next.toAccountId === next.accountId) return "toAccountId"
      return null
    }
    const categories = categoryGroups.filter((group) => group.type === next.kind).flatMap((group) => group.items)
    if (!categories.some((item) => item.id === next.categoryId)) return "category"
    if (!findAccount(next.accountId)) return "accountId"
    return null
  }

  const complete = firstMissing(draft) === null

  const open = (field: BlankField) => {
    window.clearTimeout(advanceTimer.current)
    setEdited(true)
    setEditing((current) => (current === field ? null : field))
  }

  /** Done with a blank: on to the next one missing, or back to the actions. */
  const advance = (next: AiTransactionDraft = draft) => {
    window.clearTimeout(advanceTimer.current)
    setEditing(firstMissing(next))
  }

  /** A choice: shown as picked for a moment, then on. */
  const pick = (values: Partial<AiTransactionDraft>) => {
    const next = { ...draft, ...values }
    setDraft(next)
    window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => advance(next), 220)
  }

  const update = (values: Partial<AiTransactionDraft>) =>
    setDraft((current) => ({ ...current, ...values }))

  const blank = (field: BlankField, props: Omit<BlankProps, "active" | "onClick">) => (
    <Blank {...props} active={editing === field} onClick={() => open(field)} />
  )

  const accountName = (field: "accountId" | "toAccountId", value: Account | undefined) =>
    blank(field, { placeholder: "tài khoản nào", filled: value !== undefined, valueKey: value?.id ?? "", children: value?.name })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          {/* Loose leading leaves room for the blanks' underline and background. */}
          <motion.p
            className="text-lg leading-[2.2] text-muted-foreground"
            variants={sentence}
            initial="hidden"
            animate="shown"
          >
            <motion.span variants={phrase}>
              {blank("date", { placeholder: "", filled: true, valueKey: draft.date, children: formatDayLabel(draft.date, today) })}
              , bạn đã{" "}
            </motion.span>
            <motion.span variants={phrase}>
              {blank("kind", { placeholder: "", filled: true, valueKey: draft.kind, children: kindWords[draft.kind] })}{" "}
              {blank("amount", {
                placeholder: "bao nhiêu",
                filled: draft.amount !== null,
                valueKey: String(draft.amount),
                children: formatCurrency(draft.amount ?? 0),
              })}{" "}
            </motion.span>
            {draft.kind === "transfer" ? (
              <motion.span variants={phrase}>
                từ {accountName("accountId", account)} sang {accountName("toAccountId", toAccount)}
              </motion.span>
            ) : (
              <>
                <motion.span variants={phrase}>
                  {draft.kind === "expense" ? "cho" : "từ"}{" "}
                  {blank("category", {
                    placeholder: "hạng mục nào",
                    filled: category !== undefined,
                    valueKey: category?.id ?? "",
                    children: category?.name,
                  })}{" "}
                </motion.span>
                <motion.span variants={phrase}>
                  {draft.kind === "expense" ? "từ" : "vào"} {accountName("accountId", account)}
                </motion.span>
              </>
            )}
            <motion.span variants={phrase}>
              , ghi là{" "}
              {blank("title", {
                placeholder: "nội dung gì",
                filled: draft.title.trim() !== "",
                valueKey: draft.title.trim() ? "title" : "",
                children: draft.title,
              })}
              .
            </motion.span>
          </motion.p>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.form
            key={editing}
            id={EDITOR_ID}
            className="space-y-3"
            aria-label={fieldCaptions[editing]}
            // Enter in a text field, or Xong, finishes the blank.
            onSubmit={(event) => {
              event.preventDefault()
              advance()
            }}
            {...panelMotion}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {fieldCaptions[editing]}
              </p>
              <Button type="submit" variant="ghost" size="sm">
                <CheckIcon />
                Xong
              </Button>
            </div>
            <BlankEditor
              field={editing}
              draft={draft}
              today={today}
              groups={groups}
              accounts={activeAccounts}
              onPick={pick}
              onChange={update}
            />
          </motion.form>
        ) : (
          <motion.div
            key="actions"
            className="space-y-4"
            {...panelMotion}
            transition={{ duration: 0.3, ease: EASE_OUT, delay: edited ? 0 : 0.45 }}
          >
            <p className="px-3 text-xs text-muted-foreground">
              {complete ? "Bấm vào từ được gạch chân để sửa." : "Điền các ô còn trống trước khi lưu."}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type BlankEditorProps = {
  field: BlankField
  draft: AiTransactionDraft
  today: string
  /** The category groups of the draft's kind. */
  groups: CategoryGroup[]
  accounts: Account[]
  /** A choice, after which the editor moves on. */
  onPick: (values: Partial<AiTransactionDraft>) => void
  /** Typing, which stays in the editor. */
  onChange: (values: Partial<AiTransactionDraft>) => void
}

function BlankEditor({ field, draft, today, groups, accounts, onPick, onChange }: BlankEditorProps) {
  switch (field) {
    case "kind":
      return (
        <TransactionKindSelector
          value={draft.kind}
          // A category or receiving account of the other kind no longer fits.
          onValueChange={(kind) => onPick({ kind, categoryId: undefined, toAccountId: undefined })}
        />
      )
    case "amount":
      return <AmountEditor amount={draft.amount} onChange={(amount) => onChange({ amount })} />
    case "date":
      return <DateEditor date={draft.date} today={today} onPick={(date) => onPick({ date })} />
    case "category":
      return (
        // Long catalogs scroll inside the drawer, natively: ScrollArea's
        // thumb, moved by script, lagged behind on iOS. vaul takes a swipe up
        // at the top of a list for closing the drawer, which made it jolt on
        // the first swipe; this list is left to scroll.
        <div data-vaul-no-drag className="max-h-64 overflow-y-auto overscroll-contain">
          <div className="space-y-3">
            {groups.map((group) => {
              const color = getCategoryColor(group.colorName)
              return (
                <div key={group.id} className="space-y-2">
                  <p className="px-3 text-xs text-muted-foreground">{group.name}</p>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={draft.categoryId ?? ""}
                    // Tapping the picked one again keeps it and moves on.
                    onValueChange={(categoryId) => onPick(categoryId ? { categoryId } : {})}
                    className="flex-wrap p-1"
                    aria-label={group.name}
                  >
                    {group.items.map((item) => {
                      const ItemIcon = categoryIconRegistry[item.iconName]
                      return (
                        <ToggleGroupItem key={item.id} value={item.id}>
                          <ItemIcon className={color.iconClassName} />
                          {item.name}
                        </ToggleGroupItem>
                      )
                    })}
                  </ToggleGroup>
                </div>
              )
            })}
          </div>
        </div>
      )
    case "accountId":
    case "toAccountId": {
      // A transfer cannot land in the account it leaves.
      const choices =
        field === "toAccountId" ? accounts.filter((item) => item.id !== draft.accountId) : accounts
      return (
        <ToggleGroup
          type="single"
          value={draft[field] ?? ""}
          onValueChange={(id) => onPick(id ? { [field]: id } : {})}
          className="flex-wrap p-1"
          aria-label={fieldCaptions[field]}
        >
          {choices.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id}>
              {item.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
    }
    case "title":
      return (
        <Input
          id="ai-title"
          aria-label="Nội dung"
          value={draft.title}
          maxLength={100}
          placeholder="Ví dụ: trà sữa"
          onChange={(event) => onChange({ title: event.target.value })}
        />
      )
  }
}

function AmountEditor({ amount, onChange }: { amount: number | null; onChange: (amount: number | null) => void }) {
  // Suggestions follow the digits typed here, not the amount heard.
  const [typed, setTyped] = React.useState<number | null>(null)

  return (
    <div className="space-y-1">
      <CurrencyInput
        id="ai-amount"
        name="amount"
        value={amount}
        onValueChange={(value) => {
          setTyped(value)
          onChange(value)
        }}
      />
      <AmountSuggestions suggestions={getAmountSuggestions(typed, [])} value={amount} onSelect={onChange} />
    </div>
  )
}

function DateEditor({ date, today, onPick }: { date: string; today: string; onPick: (date: string) => void }) {
  const dateInput = React.useRef<HTMLInputElement>(null)
  const quickDates = [
    { key: today, label: "Hôm nay" },
    { key: shiftDate(today, -1), label: "Hôm qua" },
    { key: shiftDate(today, -2), label: "Hôm kia" },
  ]
  const isQuick = quickDates.some((item) => item.key === date)

  const openPicker = () => {
    const input = dateInput.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={isQuick ? date : "other"}
      onValueChange={(value) => {
        if (value === "other") openPicker()
        else onPick(value || date)
      }}
      className="flex-wrap p-1"
      aria-label="Ngày"
    >
      {quickDates.map((item) => (
        <ToggleGroupItem key={item.key} value={item.key}>
          {item.label}
        </ToggleGroupItem>
      ))}
      <span className="relative inline-flex">
        <ToggleGroupItem value="other">
          <CalendarIcon />
          {isQuick ? "Ngày khác" : formatDayLabel(date, today)}
        </ToggleGroupItem>
        {/* iOS opens its date picker only for a tap on the input itself, so
            a transparent one covers the chip. 16px text keeps iOS from
            zooming in on it. */}
        <input
          ref={dateInput}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 size-full cursor-pointer appearance-none text-base opacity-0"
          max={today}
          value={date}
          onClick={openPicker}
          onChange={(event) => {
            const value = event.target.value
            if (value && value <= today) onPick(value)
          }}
        />
      </span>
    </ToggleGroup>
  )
}
