"use client"

import * as React from "react"
import { CoinsIcon, EyeOffIcon, TagIcon, WalletCardsIcon } from "lucide-react"

import { Collapse } from "@/components/app/collapse"
import { FormSection } from "@/components/app/form-section"
import { PageSheet, PageSheetScreen } from "@/components/app/page-sheet"
import { AccountLogo } from "@/components/account-logo"
import { CurrencyInput } from "@/components/forms/currency-input"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { categoryIconRegistry } from "@/lib/icons/category-icon-registry"
import { cn } from "@/lib/utils"

import { amountPreset, amountPresets, amountSummary } from "../_lib/amount-presets"
import type { TransactionFilter, TransactionSearchFilters } from "../_types/transaction"
import { transactionKindOptions } from "./transaction-filter-fields"
import { countSheetFilters } from "./transaction-search"

type Screen = "filters" | "accounts" | "categories" | "amount"

/** "Tất cả", the one chosen, or how many. */
function pickSummary(names: string[], unit: string) {
  if (names.length === 0) return "Tất cả"
  if (names.length === 1) return names[0]
  return `${names.length} ${unit}`
}

function toggle(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id]
}

/**
 * The filters a phone keeps out of view, as iOS lists filters: the first
 * screen has one row per condition (accounts, categories, amount) saying what
 * it is set to, and a row opens its own screen (‹ back) to pick from: the
 * accounts with their logos, the categories with their icons and colours, the
 * amount from a few ranges or typed. Every pick applies at once; the footer
 * clears them (Xoá lọc) or shows the list (Xem N giao dịch). The kind leads
 * the first screen as a segmented control (2026-10-24), as the one above the
 * list; transfers and loans hide the categories.
 */
export function TransactionFilterSheet({
  open,
  onOpenChange,
  accounts,
  categoryGroups,
  filter,
  searchFilters,
  transactionCount,
  onSearchFiltersChange,
  onFilterChange,
  onReset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  filter: TransactionFilter
  searchFilters: TransactionSearchFilters
  /** How many transactions the search and filters leave. */
  transactionCount: number
  onSearchFiltersChange: (filters: TransactionSearchFilters) => void
  /** The kind, the same one the segmented control above the list chooses. */
  onFilterChange: (filter: TransactionFilter) => void
  onReset: () => void
}) {
  const [screen, setScreen] = React.useState<Screen>("filters")

  // Active accounts first; archived ones still have their old transactions.
  const sortedAccounts = [...accounts].sort(
    (left, right) => Number(left.status === "archived") - Number(right.status === "archived"),
  )
  const showCategories = filter !== "transfer" && filter !== "debt"
  const categorySides = (["expense", "income"] as const)
    .filter((type) => filter === "all" || filter === type)
    .map((type) => ({
      type,
      label: type === "expense" ? "Chi tiêu" : "Thu nhập",
      groups: categoryGroups.filter((group) => group.type === type),
    }))
    .filter((side) => side.groups.length > 0)

  const { accountIds, categoryGroupIds, minAmount, maxAmount } = searchFilters
  const accountNames = sortedAccounts.filter((account) => accountIds.includes(account.id)).map((account) => account.name)
  const categoryNames = categoryGroups.filter((group) => categoryGroupIds.includes(group.id)).map((group) => group.name)
  const preset = amountPreset(searchFilters)
  // Typing a range: open from a tap on Tuỳ chỉnh, and whenever the range is not a preset.
  const [customOpen, setCustomOpen] = React.useState(false)
  const custom = customOpen || !preset
  const amountRangeReversed = minAmount !== null && maxAmount !== null && minAmount > maxAmount
  // The kind counts here: Xoá lọc puts it back to Tất cả too.
  const hasFilters = countSheetFilters(filter, searchFilters) > 0 || filter !== "all"
  const change = (next: Partial<TransactionSearchFilters>) => onSearchFiltersChange({ ...searchFilters, ...next })

  const titles: Record<Screen, string> = {
    filters: "Bộ lọc",
    accounts: "Tài khoản",
    categories: "Hạng mục",
    amount: "Số tiền",
  }
  // "Bỏ chọn" on a pick list that has something picked: in the screen's bar, as every header button, raised.
  const clearPicks = (clear: (() => void) | undefined) =>
    clear ? (
      <Button type="button" variant="elevated" onClick={clear}>
        Bỏ chọn
      </Button>
    ) : null

  // Opened again, it starts from its first screen; every way of closing goes through here.
  const changeOpen = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setScreen("filters")
      setCustomOpen(false)
    }
  }

  // On every screen: what the filters leave is in reach from each.
  const footer = (
    // Xoá lọc only when there is something to clear: cleared, it narrows
    // away as Xem widens to the full width, and slides back in when a
    // filter is picked again.
    <div className="flex">
      <div
        inert={!hasFilters}
        className={cn(
          "min-w-0 overflow-hidden transition-[flex-basis,margin,opacity] duration-300 ease-out motion-reduce:transition-none",
          hasFilters ? "mr-2 basis-1/3" : "mr-0 basis-0 opacity-0",
        )}
      >
        <Button type="button" variant="elevated" className="w-full whitespace-nowrap"
          onClick={() => {
            onReset()
            // Cleared, the amount is "Bất kỳ" again, not a range being typed.
            setCustomOpen(false)
          }}
        >
          Xoá lọc
        </Button>
      </div>
      <Button type="button" className="min-w-0 flex-1" onClick={() => changeOpen(false)}>
        Xem {transactionCount} giao dịch
      </Button>
    </div>
  )
  const back = () => setScreen("filters")

  return (
    <PageSheet
      title={titles.filters}
      open={open}
      onOpenChange={changeOpen}
      footer={footer}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-2">
          <h2 className={cn("px-4", groupCaptionClassName)}>Loại giao dịch</h2>
          <Tabs value={filter} onValueChange={(value) => onFilterChange(value as TransactionFilter)}>
            <TabsList variant="segmented" className="w-full" aria-label="Loại giao dịch">
              {transactionKindOptions.filter((item) => item.value !== "debt" || filter === "debt").map((item) => (
                <TabsTrigger key={item.value} value={item.value} className="flex-auto px-2">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </section>
        {/* Grey tiles, as the switch row below (2026-10-21): a filter is not a category, colour would say it is. */}
        <SettingsGroup>
          <SettingsRow
            icon={WalletCardsIcon}
            tone="neutral"
            title="Tài khoản"
            value={pickSummary(accountNames, "tài khoản")}
            onClick={() => setScreen("accounts")}
          />
          {showCategories ? (
            <SettingsRow
              icon={TagIcon}
              tone="neutral"
              title="Hạng mục"
              value={pickSummary(categoryNames, "hạng mục")}
              onClick={() => setScreen("categories")}
            />
          ) : null}
          <SettingsRow
            icon={CoinsIcon}
            tone="neutral"
            title="Số tiền"
            value={amountSummary(searchFilters)}
            onClick={() => setScreen("amount")}
          />
        </SettingsGroup>

        {/* Income and spending only: transfers and loans are never in the figures. */}
        {filter === "all" || filter === "expense" || filter === "income" ? (
          <SettingsGroup>
            <SettingsRow
              icon={EyeOffIcon}
              tone="neutral"
              title="Chỉ khoản ngoài báo cáo"
              description="Không tính vào báo cáo"
              action={
                <Switch
                  aria-label="Chỉ khoản không tính vào báo cáo"
                  checked={Boolean(searchFilters.excludedOnly)}
                  onCheckedChange={(excludedOnly) => change({ excludedOnly })}
                />
              }
            />
          </SettingsGroup>
        ) : null}
      </div>

      <PageSheetScreen
        open={screen === "accounts"}
        title={titles.accounts}
        onBack={back}
        action={clearPicks(accountIds.length > 0 ? () => change({ accountIds: [] }) : undefined)}
        footer={footer}
      >
        <SettingsGroup>
          {sortedAccounts.map((account) => (
            <SettingsRow
              key={account.id}
              media={<AccountLogo account={account} />}
              title={account.name}
              description={account.status === "archived" ? "Đã khoá" : undefined}
              checked={accountIds.includes(account.id)}
              onClick={() => change({ accountIds: toggle(accountIds, account.id) })}
            />
          ))}
        </SettingsGroup>
      </PageSheetScreen>

      <PageSheetScreen
        open={screen === "categories"}
        title={titles.categories}
        onBack={back}
        action={clearPicks(categoryGroupIds.length > 0 ? () => change({ categoryGroupIds: [] }) : undefined)}
        footer={footer}
        className="gap-6"
      >
        {categorySides.map((side) => (
          <SettingsGroup key={side.type} title={side.label}>
            {side.groups.map((group) => (
              <SettingsRow
                key={group.id}
                icon={categoryIconRegistry[group.iconName]}
                tone={group.colorName}
                title={group.name}
                checked={categoryGroupIds.includes(group.id)}
                onClick={() => change({ categoryGroupIds: toggle(categoryGroupIds, group.id) })}
              />
            ))}
          </SettingsGroup>
        ))}
      </PageSheetScreen>

      <PageSheetScreen open={screen === "amount"} title={titles.amount} onBack={back} footer={footer} className="gap-6">
        <SettingsGroup>
          {amountPresets.map((option) => (
            <SettingsRow
              key={option.key}
              title={option.label}
              checked={!custom && preset?.key === option.key}
              onClick={() => {
                setCustomOpen(false)
                change({ minAmount: option.min, maxAmount: option.max })
              }}
            />          ))}
          <SettingsRow title="Tuỳ chỉnh" checked={custom} onClick={() => setCustomOpen(true)} />
        </SettingsGroup>
        {/* The range typed, sliding open under Tuỳ chỉnh. */}
        <Collapse open={custom} className="-mt-6 data-[state=open]:mt-0">
          <FormSection>
            {/* One above the other, so each field and its suggestions have the full width. */}
            <FieldGroup className="gap-2">
              <div className="flex flex-col gap-5">
                <Field data-invalid={amountRangeReversed || undefined}>
                  <FieldLabel htmlFor="transaction-sheet-min-amount">Từ</FieldLabel>
                  <CurrencyInput
                    id="transaction-sheet-min-amount"
                    name="minAmount"
                    value={minAmount}
                    onValueChange={(value) => change({ minAmount: value })}
                    placeholder="0"
                    invalid={amountRangeReversed}
                  />
                </Field>
                <Field data-invalid={amountRangeReversed || undefined}>
                  <FieldLabel htmlFor="transaction-sheet-max-amount">Đến</FieldLabel>
                  <CurrencyInput
                    id="transaction-sheet-max-amount"
                    name="maxAmount"
                    value={maxAmount}
                    onValueChange={(value) => change({ maxAmount: value })}
                    placeholder="Không giới hạn"
                    invalid={amountRangeReversed}
                  />
                </Field>
              </div>
              {amountRangeReversed ? <FieldError>Số tiền đến phải lớn hơn số tiền từ.</FieldError> : null}
            </FieldGroup>
          </FormSection>
        </Collapse>
      </PageSheetScreen>
    </PageSheet>
  )
}
