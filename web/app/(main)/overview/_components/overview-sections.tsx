"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
  PlusIcon,
  ReceiptTextIcon,
  SparklesIcon,
  WalletCardsIcon,
  type LucideIcon,
} from "lucide-react"

import { Money } from "@/components/app/money"
import { SectionHeader } from "@/components/app/section-header"

import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import { getCategoryColor, type CategoryColorName } from "@/lib/categories/category-colors"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import type { OverviewSummary } from "@/lib/overview/summary"
import { cn } from "@/lib/utils"

import { AddTransactionSheet } from "../../transactions/_components/add-transaction/add-transaction-sheet"
import { CashFlowChart } from "./overview-charts"

const overdueClassName = "text-expense"

type NetWorthRowProps = {
  icon: LucideIcon
  color: CategoryColorName
  label: string
  value: number
  href: string
}

/** One of the amounts behind the total, as a row that opens its page. */
function NetWorthRow({ icon: Icon, color, label, value, href }: NetWorthRowProps) {
  return (
    <li className="relative not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-12 not-first:before:h-px not-first:before:bg-border">
      <Link
        href={href}
        className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/40 active:bg-secondary"
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            getCategoryColor(color).surfaceClassName,
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1 text-[15px]">{label}</span>
        <span className="text-[15px] font-medium tabular-nums">{formatCurrency(value)}</span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}

type NetWorthProps = {
  data: OverviewSummary["netWorth"]
  accounts: Account[]
  categoryGroups: CategoryGroup[]
}

/**
 * The overview's lead card: the net worth large, quick actions below it, and
 * the three amounts it is made of.
 */
export function NetWorth({ data, accounts, categoryGroups }: NetWorthProps) {
  const [addOpen, setAddOpen] = React.useState(false)

  return (
    <section aria-labelledby="net-worth-title">
      <Card>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <h2 id="net-worth-title" className="text-sm text-muted-foreground">
              Tài sản ròng
            </h2>
            <Money
              amount={data.total}
              className={cn(
                "block text-4xl leading-tight font-semibold tracking-tight [overflow-wrap:anywhere]",
                data.total < 0 && overdueClassName,
              )}
            />
          </div>
          {/* Quick actions, as the pills under a balance in a banking app. */}
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="secondary" className="px-2" onClick={() => setAddOpen(true)}>
              <PlusIcon data-icon="inline-start" aria-hidden="true" />
              Thêm
            </Button>
            <Button variant="secondary" className="px-2" asChild>
              <Link href="/transactions?ai=1">
                <SparklesIcon data-icon="inline-start" aria-hidden="true" />
                Nhập AI
              </Link>
            </Button>
            <Button variant="secondary" className="px-2" asChild>
              <Link href="/transactions">
                <ReceiptTextIcon data-icon="inline-start" aria-hidden="true" />
                Giao dịch
              </Link>
            </Button>
          </div>
          <ul>
            <NetWorthRow icon={WalletCardsIcon} color="blue" label="Tài khoản" value={data.cash} href="/budget" />
            <NetWorthRow icon={ArrowDownLeftIcon} color="emerald" label="Cho vay" value={data.receivable} href="/debts" />
            <NetWorthRow icon={ArrowUpRightIcon} color="rose" label="Đang nợ" value={data.payable} href="/debts" />
          </ul>
        </CardContent>
      </Card>
      <AddTransactionSheet
        accounts={accounts}
        categoryGroups={categoryGroups}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </section>
  )
}

/** Income and expenses over the last six months. */
export function CashFlowTrend({ summary }: { summary: OverviewSummary }) {
  return (
    <section aria-labelledby="cash-flow-trend-title" className="space-y-3">
      <SectionHeader id="cash-flow-trend-title" title="Thu chi 6 tháng" href="/transactions" />
      <Card>
        <CardContent>
          {summary.cashFlow.hasActivity ? (
            <CashFlowChart data={summary.cashFlow} />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Chưa có thu chi.</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words

  return letters.map((word) => word[0]).join("").toUpperCase() || "?"
}

function getDueLabel(daysUntilDue: number) {
  if (daysUntilDue < 0) return `Quá ${Math.abs(daysUntilDue)} ngày`
  if (daysUntilDue === 0) return "Đến hạn hôm nay"
  return `Còn ${daysUntilDue} ngày`
}

/** Debts due within two weeks; hidden when there are none. */
export function DueDebts({ debts }: { debts: OverviewSummary["dueDebts"] }) {
  const router = useRouter()

  if (debts.length === 0) return null

  return (
    <SettingsGroup heading="section" title="Sắp đến hạn">
      {debts.map((debt) => (
        <SettingsRow
          key={debt.id}
          media={
            <Avatar>
              <AvatarFallback>{getInitials(debt.contactName)}</AvatarFallback>
            </Avatar>
          }
          title={debt.contactName}
          description={debt.direction === "lent" ? "Cho vay" : "Đi vay"}
          action={
            <span className="flex flex-col items-end">
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(debt.remainingAmount)}
              </span>
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  debt.daysUntilDue <= 0 && overdueClassName,
                )}
              >
                {getDueLabel(debt.daysUntilDue)}
              </span>
            </span>
          }
          onClick={() => router.push(`/debts?debt=${encodeURIComponent(debt.id)}`)}
        />
      ))}
    </SettingsGroup>
  )
}
