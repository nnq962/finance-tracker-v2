"use client"

import * as React from "react"
import { ShoppingBagIcon, WalletCardsIcon } from "lucide-react"
import { toast } from "sonner"

import { AccountLogo } from "@/components/account-logo"
import { NoticeBanner } from "@/components/app/notice-banner"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { PageSheet, PageSheetFooter, usePageSheetScreen } from "@/components/app/page-sheet"
import { CurrencyInput } from "@/components/forms/currency-input"
import { TimeRows } from "@/components/forms/time-rows"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { getCurrentLocalDateTime, getLocalDateTime } from "@/lib/date-time"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, toDateKey } from "@/lib/format-date"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { randomId } from "@/lib/random-id"
import { cn } from "@/lib/utils"

import { AccountPicker } from "../../../transactions/_components/add-transaction/fields/account-fields"
import { CategoryPicker } from "../../../transactions/_components/add-transaction/fields/category-fields"
import { buyWithJarAction } from "../../savings-actions"

/**
 * Bought what the jar was for: the price (the target to start with) spent
 * from the jar in a category (shopping, if there is one), when; what is left
 * in the jar goes to an account, or what is missing comes from one. Saved, it
 * is an expense and the jar is done ("Hũ đã hoàn thành").
 */
export function BoughtSheet({
  jar,
  accounts,
  categoryGroups,
  since,
  open,
  onOpenChange,
  onDone,
}: {
  jar: Account
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** When money last went in or out of the jar: it is not bought before that. */
  since?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Saved: the jar's own sheet closes too, as the jar moves to the done ones. */
  onDone: () => void
}) {
  return (
    <PageSheet title={`Đã mua “${jar.name}”`} open={open} onOpenChange={onOpenChange}>
      {open ? (
        <BoughtForm
          jar={jar}
          accounts={accounts}
          categoryGroups={categoryGroups}
          since={since}
          onDone={() => {
            onOpenChange(false)
            onDone()
          }}
        />
      ) : null}
    </PageSheet>
  )
}

function BoughtForm({
  jar,
  accounts,
  categoryGroups,
  since,
  onDone,
}: {
  jar: Account
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  since?: string
  onDone: () => void
}) {
  const today = toDateKey(new Date())
  const groups = categoryGroups.filter((group) => group.type === "expense" && group.items.length > 0)
  const items = groups.flatMap((group) => group.items)
  const choices = accounts.filter((account) => account.status === "active" && account.type !== "savings")
  const [pending, startTransition] = React.useTransition()
  const [requestId] = React.useState(() => randomId())
  const [error, setError] = React.useState<string | null>(null)
  const [price, setPrice] = React.useState<number | null>(jar.goal?.target ?? null)
  // Shopping to start with, when the user has such a category.
  const [categoryId, setCategoryId] = React.useState(
    () => items.find((item) => /mua sắm/i.test(item.name))?.id ?? groups.find((group) => /mua sắm/i.test(group.name))?.items[0]?.id ?? "",
  )
  const [accountId, setAccountId] = React.useState(() => [...choices].sort((left, right) => right.balance - left.balance)[0]?.id ?? "")
  const [when, setWhen] = React.useState(getCurrentLocalDateTime)
  const [picking, setPicking] = React.useState<"category" | "account" | null>(null)
  usePageSheetScreen(
    picking ? { title: picking === "category" ? "Chọn hạng mục" : "Chọn tài khoản", onBack: () => setPicking(null) } : null,
  )

  const category = items.find((item) => item.id === categoryId)
  const account = choices.find((item) => item.id === accountId)
  const rest = jar.balance - (price ?? 0)
  const earliest = since ? getLocalDateTime(since) : null

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!price) {
      setError("Nhập giá mua.")
      document.getElementById("jar-price")?.focus()
      return
    }
    if (!categoryId) return setError("Chọn hạng mục.")
    if (earliest && `${when.date} ${when.time}` < `${earliest.date} ${earliest.time}`) {
      return setError(`Ngày mua không được trước lần nạp/rút gần nhất (${formatDate(earliest.date)}).`)
    }
    if (rest !== 0 && !accountId) return setError(rest > 0 ? "Chọn tài khoản nhận phần thừa." : "Chọn tài khoản trả phần thiếu.")
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      try {
        const result = await buyWithJarAction(jar.id, formData)
        if (!result.success) return setError(result.error)
        toast.success(`Đã mua “${jar.name}”. Hũ chuyển sang Đã hoàn thành.`)
        onDone()
      } catch {
        setError("Không thể lưu. Vui lòng thử lại.")
      }
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-1 flex-col">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="categoryId" value={categoryId} />
      {rest !== 0 ? <input type="hidden" name="otherAccountId" value={accountId} /> : null}

      {picking === "category" ? (
        <CategoryPicker
          groups={groups}
          value={categoryId}
          onPick={(id) => {
            setCategoryId(id)
            setPicking(null)
          }}
        />
      ) : null}
      {picking === "account" ? (
        <AccountPicker
          accounts={choices}
          value={accountId}
          onPick={(id) => {
            setAccountId(id)
            setPicking(null)
          }}
        />
      ) : null}

      <div className={cn("flex flex-col gap-6 pb-4", picking && "hidden")}>
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="jar-price" className="text-xs text-muted-foreground">
            Giá mua
          </label>
          <CurrencyInput
            variant="hero"
            id="jar-price"
            name="amount"
            value={price}
            onValueChange={setPrice}
            sign="−"
            suggestions={false}
            required
          />
          <p className="text-center text-xs text-muted-foreground">Lấy từ hũ, đang có {formatCurrency(jar.balance)}</p>
        </div>

        <SettingsGroup>
          <SettingsRow
            media={
              category ? (
                <IconTile icon={categoryIconRegistry[category.iconName]} tone={category.colorName} size="sm" />
              ) : (
                <IconTile icon={ShoppingBagIcon} size="sm" />
              )
            }
            title="Hạng mục"
            value={category?.name ?? "Chọn hạng mục"}
            onClick={() => setPicking("category")}
          />
          <TimeRows
            idPrefix="jar-bought"
            date={when.date}
            time={when.time}
            today={today}
            min={earliest?.date}
            onDateChange={(date) => setWhen((current) => ({ ...current, date }))}
            onTimeChange={(time) => setWhen((current) => ({ ...current, time }))}
            invalid={false}
          />
        </SettingsGroup>

        {rest !== 0 && choices.length === 0 ? (
          <NoticeBanner tone="warning" icon={WalletCardsIcon} title="Không có tài khoản nào khả dụng">
            {`Các tài khoản chính đều đã khoá. Mở khoá hoặc thêm một tài khoản để ${rest > 0 ? "nhận phần thừa" : "trả phần thiếu"}, hoặc nhập giá bằng số tiền trong hũ.`}
          </NoticeBanner>
        ) : null}
        {rest !== 0 ? (
          <SettingsGroup
            footer={rest > 0 ? "Phần thừa sẽ chuyển về tài khoản này." : "Phần thiếu trả từ tài khoản này."}
          >
            <SettingsRow title={rest > 0 ? "Còn thừa" : "Thiếu"} value={<Money amount={Math.abs(rest)} size="sm" />} />
            <SettingsRow
              media={account ? <AccountLogo account={account} /> : undefined}
              title={rest > 0 ? "Chuyển về" : "Trả thêm từ"}
              value={account?.name ?? (choices.length ? "Chọn tài khoản" : "Không có")}
              onClick={choices.length ? () => setPicking("account") : undefined}
            />
          </SettingsGroup>
        ) : null}
      </div>

      {picking ? null : (
        <PageSheetFooter>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Spinner /> : null}
            {pending ? "Đang lưu…" : "Ghi khoản chi"}
          </Button>
        </PageSheetFooter>
      )}
    </form>
  )
}
