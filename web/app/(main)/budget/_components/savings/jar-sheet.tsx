"use client"

import { ArrowDownLeftIcon, ArrowUpRightIcon, PartyPopperIcon, PencilIcon, ShoppingBagIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Money } from "@/components/app/money"
import { NoticeBanner } from "@/components/app/notice-banner"
import { PageSheet } from "@/components/app/page-sheet"
import { SettingsGroup, SettingsRow } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import type { Account } from "@/lib/accounts/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatDate, formatShortDate, toDateKey } from "@/lib/format-date"
import { amountLeft, dueLeftLabel, monthlyAmount, savedShare } from "@/lib/savings/plan"
import type { Transaction } from "@/lib/transactions/types"

import { JarRing } from "./jar-ring"

/** A move of the jar's money as its history says it: in from, out to, or spent. */
function describe(transaction: Transaction, jarId: string) {
  if (transaction.kind === "transfer") {
    const into = transaction.toAccountId === jarId
    const other = into ? transaction.fromAccountName : transaction.toAccountName
    return {
      icon: into ? ArrowDownLeftIcon : ArrowUpRightIcon,
      tone: into ? ("income" as const) : ("neutral" as const),
      title: into ? "Nạp vào" : "Rút ra",
      where: `${into ? "Từ" : "Về"} ${other ?? "tài khoản khác"}`,
      amount: into ? Math.abs(transaction.amount) : -Math.abs(transaction.amount),
    }
  }
  return {
    icon: transaction.kind === "expense" ? ShoppingBagIcon : ArrowDownLeftIcon,
    tone: "neutral" as const,
    title: transaction.kind === "expense" ? "Đã mua" : "Thu vào",
    where: transaction.categoryName ?? "",
    amount: transaction.kind === "expense" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount),
  }
}

/**
 * A savings jar: its ring, name, what it holds and how far it is of the
 * target; then what is missing, the due month and what to put in each month; its
 * latest moves. At the foot, take out and put in, or once it is full,
 * "Đã mua". The pencil edits it (and deletes it). A finished jar only shows.
 */
export function JarSheet({
  jar,
  transactions,
  open,
  onOpenChange,
  onEdit,
  onMove,
  onBought,
  children,
}: {
  jar: Account
  /** Its latest moves, newest first. */
  transactions: Transaction[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onMove: (way: "in" | "out") => void
  onBought: () => void
  /** Sheets opened from it (put in, take out, bought, edit): pushed into it, ‹ back to it. */
  children?: React.ReactNode
}) {
  const router = useRouter()
  const today = toDateKey(new Date())
  const done = Boolean(jar.goal?.completedAt)
  const target = jar.goal?.target ?? 0
  const left = amountLeft(jar)
  const full = !done && left === 0
  const monthly = monthlyAmount(jar, today)
  const due = jar.goal?.due
  // What it cost, once bought: the expense paid from it.
  const price = done ? transactions.find((transaction) => transaction.kind === "expense" && transaction.accountId === jar.id)?.amount : undefined

  return (
    <PageSheet
      title="Chi tiết hũ"
      open={open}
      onOpenChange={onOpenChange}
      className="gap-6"
      action={
        <Button type="button" variant="elevated" size="icon" aria-label="Sửa hũ" onClick={onEdit}>
          <PencilIcon />
        </Button>
      }
      footer={
        done ? null : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="flex-1" disabled={jar.balance <= 0} onClick={() => onMove("out")}>
              <ArrowUpRightIcon data-icon="inline-start" /> Rút ra
            </Button>
            {full ? (
              <Button className="flex-1" onClick={onBought}>
                <ShoppingBagIcon data-icon="inline-start" /> Đã mua
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => onMove("in")}>
                <ArrowDownLeftIcon data-icon="inline-start" /> Nạp vào hũ
              </Button>
            )}
          </div>
        )
      }
    >
      <div className="flex flex-col items-center pt-2 text-center">
        <JarRing jar={jar} size="lead" />
        <p className="mt-3 max-w-full truncate text-base text-muted-foreground">{jar.name}</p>
        <Money amount={done ? Math.abs(price ?? target) : jar.balance} size="xl" />
        <p className="mt-1 text-sm text-muted-foreground">
          {done
            ? `Đã mua ${formatDate(toDateKey(jar.goal!.completedAt!))}`
            : `${Math.round(savedShare(jar) * 100)}% của ${formatCurrency(target)}`}
        </p>
      </div>

      {full ? (
        <NoticeBanner tone="income" icon={PartyPopperIcon} title={`Hũ “${jar.name}” đã đủ tiền`}>
          Mua xong thì bấm Đã mua.
        </NoticeBanner>
      ) : null}

      {done ? null : (
        <SettingsGroup>
          <SettingsRow title="Còn thiếu" value={left ? <Money amount={left} size="sm" tone="muted" /> : "Đã đủ"} />
          {due ? <SettingsRow title="Hạn" value={`${formatDate(due)} · ${dueLeftLabel(due, today)}`} /> : null}
          {monthly ? <SettingsRow title="Mỗi tháng nên nạp" value={<Money amount={monthly} size="sm" />} /> : null}
        </SettingsGroup>
      )}

      {transactions.length > 0 ? (
        <SettingsGroup flat title="Lịch sử">
          {transactions.map((transaction) => {
            const move = describe(transaction, jar.id)
            return (
              <SettingsRow
                key={transaction.id}
                icon={move.icon}
                tone={move.tone}
                title={move.title}
                description={[move.where, transaction.note].filter(Boolean).join(" · ") || undefined}
                action={
                  <span className="flex flex-col items-end">
                    <Money amount={move.amount} sign="always" size="sm" tone={move.amount > 0 ? "income" : "default"} />
                    <span className="text-xs text-muted-foreground">{formatShortDate(toDateKey(transaction.occurredAt))}</span>
                  </span>
                }
              />
            )
          })}
          <SettingsRow title="Xem tất cả" onClick={() => router.push(`/transactions?account=${encodeURIComponent(jar.id)}`)} />
        </SettingsGroup>
      ) : null}
      {children}
    </PageSheet>
  )
}
