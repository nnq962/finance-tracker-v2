"use client"

import * as React from "react"
import { ArrowLeftRightIcon, CheckIcon, PlusIcon, RotateCcwIcon, WalletIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ChipButton } from "@/components/app/chip-row"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { PageSheet } from "@/components/app/page-sheet"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  saveCheckedDraftsAction,
  undoSavedDraftsAction,
  type CheckedDraft,
  type SavedDrafts,
} from "@/app/(main)/transactions/actions"
import { NEW_CATEGORY_ID } from "@/app/(main)/transactions/_components/add-transaction/fields/category-fields"
import { TransactionForm } from "@/app/(main)/transactions/_components/add-transaction/transaction-form"
import { TransactionKindSelector } from "@/app/(main)/transactions/_components/add-transaction/transaction-kind-selector"
import type { Account } from "@/lib/accounts/types"
import type { AssistantDraft } from "@/lib/ai/assistant/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCompactCurrency } from "@/lib/format-currency"
import { getCurrentLocalDateTime } from "@/lib/date-time"
import { formatShortDate } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import type { SupportedTransactionKind, Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

/** Each turn's drafts as last left, by its first draft's id, for the card shown again. */
const draftsCache = new Map<string, { drafts: AssistantDraft[]; saved: SavedDrafts | null }>()

/** What a draft still needs before it can be saved, in the words its row shows; null when ready. */
function missing(draft: AssistantDraft) {
  if (!draft.amount) return "Chưa có số tiền"
  if (!draft.accountId) return "Chọn tài khoản"
  if (draft.kind === "transfer" && !draft.toAccountId) return "Chọn tài khoản nhận"
  // A suggested category is made as it is saved (2026-10-12).
  if (draft.kind !== "transfer" && !draft.categoryId && !draft.suggestedCategory) return "Chọn hạng mục"
  // A time after now cannot be saved (changed in the form, or a clock moved on).
  const now = getCurrentLocalDateTime()
  if (draft.date > now.date || (draft.date === now.date && draft.time > now.time)) return "Giờ ở tương lai, chạm để sửa"
  return null
}

/**
 * The categories saving will make, in a sentence: "Ăn vặt, giải trí và đổ
 * xăng sẽ được tạo mới", names after the first in lower case as they read
 * mid-sentence.
 */
function newCategoriesLine(names: string[]) {
  const words = names.map((name, index) => (index === 0 ? name : name.toLocaleLowerCase("vi-VN")))
  const list = words.length > 1 ? `${words.slice(0, -1).join(", ")} và ${words.at(-1)}` : words[0]
  return `${list} sẽ được tạo mới`
}

/** A category still to be made, as it will look: its icon, its group's colour (plain for a new group), and "Mới". */
export function SuggestedTile({
  suggestion,
  categoryGroups,
  size,
}: {
  suggestion: NonNullable<AssistantDraft["suggestedCategory"]>
  categoryGroups: CategoryGroup[]
  size?: "sm"
}) {
  const group = categoryGroups.find((item) => item.id === suggestion.groupId)
  const icon = (suggestion.iconName && categoryIconRegistry[suggestion.iconName]) || PlusIcon
  return <IconTile icon={icon} tone={group?.colorName ?? "card"} size={size} badge="Mới" />
}

/** The draft as the transaction form fills itself in from: a transaction written again. */
function asFormDraft(draft: AssistantDraft) {
  const copyOf = {
    id: draft.id,
    kind: draft.kind,
    title: "",
    description: "",
    amount: draft.amount ?? 0,
    occurredAt: "",
    ...(draft.kind === "transfer"
      ? { fromAccountId: draft.accountId, toAccountId: draft.toAccountId, fee: draft.fee }
      : { accountId: draft.accountId, categoryId: draft.categoryId, excluded: draft.excluded }),
  } as Transaction
  return {
    kind: draft.kind,
    amount: draft.amount,
    note: draft.note,
    occurredAt: new Date(`${draft.date}T${draft.time}:00+07:00`).toISOString(),
    requestId: draft.id,
    copyOf,
  }
}

/** The form's fields back into the draft, read as the server will read them. */
function fromForm(formData: FormData, draft: AssistantDraft): AssistantDraft {
  const text = (name: string) => {
    const value = formData.get(name)
    return typeof value === "string" ? value.trim() : ""
  }
  const kind = text("kind") as SupportedTransactionKind
  const amount = Number(text("amount"))
  return {
    ...draft,
    kind,
    amount: Number.isSafeInteger(amount) && amount > 0 ? amount : null,
    note: text("note"),
    date: text("date") || draft.date,
    time: text("time") || draft.time,
    accountId: (kind === "transfer" ? text("fromAccountId") : text("accountId")) || undefined,
    toAccountId: kind === "transfer" ? text("toAccountId") || undefined : undefined,
    // The suggested category kept ("Mới" in the grid), or one picked instead.
    categoryId: kind === "transfer" || text("categoryId") === NEW_CATEGORY_ID ? undefined : text("categoryId") || undefined,
    // A suggestion belongs to its kind: switching kind drops it.
    suggestedCategory: kind === draft.kind ? draft.suggestedCategory : undefined,
    fee: kind === "transfer" ? Number(text("fee")) || 0 : 0,
    excluded: kind !== "transfer" && (formData.get("excluded") === "on"),
  }
}

/**
 * Transactions told to Timi, to check before they are written down
 * (2026-10-12): a row each, as the transactions list shows them, anything
 * missing said in red where it is. A row opens the transaction form, filled
 * in, to change it; × leaves it out. One button saves them all at once, and
 * Hoàn tác takes them back.
 */
export function DraftsView({
  drafts: initial,
  accounts,
  categoryGroups,
}: {
  drafts: AssistantDraft[]
  accounts: Account[]
  categoryGroups: CategoryGroup[]
}) {
  const router = useRouter()
  // Kept by turn, so the card shown again (a question stopped midway brings
  // it back) has its edits and its saved state, not the AI's first reading.
  const turnKey = initial[0]?.id ?? ""
  const [drafts, setDraftsState] = React.useState(() => draftsCache.get(turnKey)?.drafts ?? initial)
  const setDrafts = (next: AssistantDraft[] | ((current: AssistantDraft[]) => AssistantDraft[])) =>
    setDraftsState((current) => {
      const value = typeof next === "function" ? next(current) : next
      draftsCache.set(turnKey, { drafts: value, saved: draftsCache.get(turnKey)?.saved ?? null })
      return value
    })
  const [editing, setEditing] = React.useState<string | null>(null)
  const [saved, setSavedState] = React.useState<SavedDrafts | null>(() => draftsCache.get(turnKey)?.saved ?? null)
  const setSaved = (value: SavedDrafts | null) => {
    draftsCache.set(turnKey, { drafts: draftsCache.get(turnKey)?.drafts ?? drafts, saved: value })
    setSavedState(value)
  }
  // The toast offering Hoàn tác, closed once it no longer fits (undone, saved again).
  const undoToast = React.useRef<string | number | undefined>(undefined)
  const [isPending, startTransition] = React.useTransition()
  const today = getCurrentLocalDateTime().date

  const accountName = (id?: string) => accounts.find((account) => account.id === id)?.name
  const category = (id?: string) => {
    for (const group of categoryGroups) {
      const item = group.items.find((entry) => entry.id === id)
      if (item) return { item, group }
    }
    return undefined
  }
  const change = (id: string, values: Partial<AssistantDraft>) =>
    setDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...values } : item)))
  // The new categories saving will make, one per name.
  const toCreate = [
    ...new Set(
      drafts
        .filter((draft) => draft.kind !== "transfer" && !draft.categoryId && draft.suggestedCategory)
        .map((draft) => draft.suggestedCategory!.name),
    ),
  ]
  const ready = drafts.length > 0 && drafts.every((draft) => !missing(draft))
  const edited = drafts.find((draft) => draft.id === editing)
  const [editKind, setEditKind] = React.useState<SupportedTransactionKind>("expense")

  const undo = (done: SavedDrafts) =>
    startTransition(async () => {
      const result = await undoSavedDraftsAction(done)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setSaved(null)
      toast.dismiss(undoToast.current)
      toast.success("Đã hoàn tác")
      router.refresh()
    })

  const save = () =>
    startTransition(async () => {
      const checked: CheckedDraft[] = drafts.map((draft) => ({
        id: draft.id,
        kind: draft.kind,
        amount: draft.amount ?? 0,
        accountId: draft.accountId ?? "",
        toAccountId: draft.toAccountId,
        categoryId: draft.categoryId,
        newCategory: draft.categoryId ? undefined : draft.suggestedCategory,
        fee: draft.fee,
        excluded: draft.excluded,
        note: draft.note,
        date: draft.date,
        time: draft.time,
      }))
      const result = await saveCheckedDraftsAction(checked)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const done = { ids: result.ids, categoryIds: result.categoryIds, groupIds: result.groupIds }
      setSaved(done)
      const made = done.categoryIds.length ? ` và ${done.categoryIds.length} hạng mục mới` : ""
      toast.dismiss(undoToast.current)
      undoToast.current = toast.success(`${done.ids.length > 1 ? `Đã ghi ${done.ids.length} giao dịch` : "Đã ghi giao dịch"}${made}`, {
        action: { label: "Hoàn tác", onClick: () => undo(done) },
      })
      router.refresh()
    })

  if (drafts.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Ghi giao dịch</p>
        <p className="text-sm text-muted-foreground">Đã bỏ hết các khoản. Nói hoặc gõ lại nếu cần.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          {saved ? `Đã ghi ${saved.ids.length} khoản` : drafts.length > 1 ? `Ghi ${drafts.length} khoản` : "Ghi giao dịch"}
        </p>
      </div>

      <div className="divide-y divide-separator rounded-2xl bg-field">
        {drafts.map((draft) => {
          const problem = missing(draft)
          const found = category(draft.categoryId)
          const isTransfer = draft.kind === "transfer"
          // No category fits: the suggested one, made in its group as it is saved.
          const suggested = !isTransfer && !found ? draft.suggestedCategory : undefined
          const name = isTransfer ? "Chuyển khoản" : (found?.item.name ?? suggested?.name ?? "Chưa có hạng mục")
          const where = isTransfer
            ? `${accountName(draft.accountId) ?? "?"} → ${accountName(draft.toAccountId) ?? "?"}`
            : accountName(draft.accountId)
          const when = `${draft.date === today ? "" : `${formatShortDate(draft.date)} · `}${draft.time}`
          const fee = isTransfer && draft.fee ? `phí ${formatCompactCurrency(draft.fee)}` : null
          const sub = problem ?? [where, fee, when, draft.note, draft.excluded ? "Ngoài báo cáo" : null].filter(Boolean).join(" · ")
          // The categories it could go under instead, one tap each: the new
          // one, the suggested group's own, then the form for any other.
          const offer = !saved && !isTransfer && draft.suggestedCategory
          const alternatives = offer
            ? (categoryGroups.find((group) => group.id === draft.suggestedCategory?.groupId)?.items ?? []).slice(0, 4)
            : []
          return (
            <div key={draft.id}>
              <div className="flex items-center">
                <button
                  type="button"
                  disabled={Boolean(saved)}
                  onClick={() => {
                    setEditKind(draft.kind)
                    setEditing(draft.id)
                  }}
                  className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left transition-opacity active:opacity-60 disabled:active:opacity-100"
                >
                  {isTransfer ? (
                    <IconTile icon={ArrowLeftRightIcon} tone="transfer" size="sm" />
                  ) : found ? (
                    <IconTile icon={categoryIconRegistry[found.item.iconName] ?? WalletIcon} tone={found.item.colorName} size="sm" />
                  ) : suggested ? (
                    // To be made: its suggested icon in its group's colour, "Mới" on the corner.
                    <SuggestedTile suggestion={suggested} categoryGroups={categoryGroups} size="sm" />
                  ) : (
                    <IconTile icon={WalletIcon} tone="card" size="sm" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name}</span>
                    <span className={cn("block truncate text-xs", problem ? "text-destructive-text" : "text-muted-foreground")}>
                      {sub}
                    </span>
                  </span>
                  {draft.amount ? (
                    <Money
                      amount={draft.kind === "expense" ? -draft.amount : draft.amount}
                      size="sm"
                      sign={isTransfer ? "never" : "always"}
                      tone={draft.excluded ? "muted" : draft.kind === "income" ? "income" : "default"}
                    />
                  ) : null}
                </button>
                {saved ? (
                  <CheckIcon className="mx-4 size-4 shrink-0 text-income" aria-label="Đã ghi" />
                ) : (
                  <button
                    type="button"
                    aria-label={`Bỏ khoản ${name}`}
                    onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}
                    className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-opacity active:opacity-60"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>
              {offer && draft.suggestedCategory ? (
                <div className="-mt-1 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
                  <ChipButton
                    variant="outline"
                    active={!draft.categoryId}
                    aria-pressed={!draft.categoryId}
                    onClick={() => change(draft.id, { categoryId: undefined })}
                  >
                    <PlusIcon /> {draft.suggestedCategory.name}
                  </ChipButton>
                  {alternatives.map((item) => {
                    const Icon = categoryIconRegistry[item.iconName] ?? WalletIcon
                    return (
                      <ChipButton
                        variant="outline"
                        key={item.id}
                        active={draft.categoryId === item.id}
                        aria-pressed={draft.categoryId === item.id}
                        onClick={() => change(draft.id, { categoryId: item.id })}
                      >
                        <Icon /> {item.name}
                      </ChipButton>
                    )
                  })}
                  <ChipButton
                    variant="outline"
                    onClick={() => {
                      setEditKind(draft.kind)
                      setEditing(draft.id)
                    }}
                  >
                    Khác…
                  </ChipButton>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* Said once, by the save button, with the same + the rows show. */}
      {!saved && toCreate.length > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconTile icon={PlusIcon} size="xs" />
          <span className="min-w-0">{newCategoriesLine(toCreate)}</span>
        </p>
      ) : null}

      {saved ? (
        <Button variant="secondary" disabled={isPending} onClick={() => undo(saved)}>
          {isPending ? <Spinner /> : <RotateCcwIcon />} Hoàn tác
        </Button>
      ) : (
        <Button disabled={!ready || isPending} onClick={save}>
          {isPending ? <Spinner /> : <CheckIcon />}
          {drafts.length > 1 ? `Lưu cả ${drafts.length} khoản` : "Lưu giao dịch"}
        </Button>
      )}

      {/* A row changed in the app's own form, filled in; saving it only changes the row. */}
      <PageSheet title="Sửa khoản này" open={edited !== undefined} onOpenChange={(open) => !open && setEditing(null)}>
        {edited ? (
          <TransactionForm
            key={edited.id}
            accounts={accounts}
            categoryGroups={categoryGroups}
            draft={asFormDraft(edited)}
            suggestedCategory={
              edited.suggestedCategory
                ? {
                    name: edited.suggestedCategory.name,
                    tile: <SuggestedTile suggestion={edited.suggestedCategory} categoryGroups={categoryGroups} />,
                  }
                : undefined
            }
            header={<TransactionKindSelector value={editKind} onValueChange={setEditKind} />}
            kind={editKind}
            isCreating
            submitLabel="Xong"
            successMessage="Đã sửa khoản này"
            action={async (formData) => {
              setDrafts((current) => current.map((item) => (item.id === edited.id ? fromForm(formData, item) : item)))
              return { success: true }
            }}
            onSuccess={() => setEditing(null)}
          />
        ) : null}
      </PageSheet>
    </>
  )
}
