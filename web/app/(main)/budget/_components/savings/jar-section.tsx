"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCompactCurrency, formatCurrency } from "@/lib/format-currency"
import { formatShortDate, toDateKey } from "@/lib/format-date"
import { getJarIcon } from "@/lib/savings/jar-icons"
import { amountLeft, jarPlanLabel } from "@/lib/savings/plan"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { AddCard } from "../add-card"
import { BoughtSheet } from "./bought-sheet"
import { JarCard } from "./jar-card"
import { JarFormSheet } from "./jar-form-sheet"
import { JarRing } from "./jar-ring"
import { JarSheet } from "./jar-sheet"
import { MoveJarSheet } from "./move-jar-sheet"

function JarRow({ jar, today, onSelect }: { jar: Account; today: string; onSelect: () => void }) {
  const full = amountLeft(jar) === 0
  return (
    <SettingsRow
      media={<JarRing jar={jar} />}
      title={jar.name}
      description={full ? <span className="text-income">Đủ tiền rồi 🎉</span> : jarPlanLabel(jar, today)}
      action={
        <span className="flex flex-col items-end">
          <Money amount={jar.balance} size="sm" />
          <span className="text-xs text-muted-foreground">/ {formatCompactCurrency(jar.goal?.target ?? 0, 1)}</span>
        </span>
      }
      onClick={onSelect}
    />
  )
}

/**
 * The savings jars on the accounts page (2026-10-14): "Hũ tiết kiệm · N",
 * each jar with its ring, its plan and what it holds of its target, then
 * "Thêm hũ"; under the accounts, the finished ones folded away. A jar opens
 * its sheet, from which money goes in or out, it is edited, or bought.
 */
export function JarList({
  jars,
  accounts,
  recentTransactions,
  categoryGroups,
  part,
  initialOpenId,
}: {
  /** Every savings jar, finished ones too. */
  jars: Account[]
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
  categoryGroups: CategoryGroup[]
  /** `open`: the group being filled, above the accounts; `done`: the finished ones, below them. */
  part: "open" | "done"
  /** A jar whose sheet opens straight away (a link to it). */
  initialOpenId?: string
}) {
  const today = toDateKey(new Date())
  // Opened by the group it is listed in, so only one sheet opens.
  const [openId, setOpenId] = React.useState<string | null>(
    () => jars.find((jar) => jar.id === initialOpenId && (part === "done") === Boolean(jar.goal?.completedAt))?.id ?? null,
  )
  // Each sheet keeps what it showed while it slides closed.
  const [form, setForm] = React.useState<{ open: boolean; mode: "new" | "edit" }>({ open: false, mode: "new" })
  const [move, setMove] = React.useState<{ open: boolean; way: "in" | "out" }>({ open: false, way: "in" })
  const [buying, setBuying] = React.useState(false)
  // Keeps the last jar on screen while its sheets slide closed (or it is deleted).
  const found = jars.find((jar) => jar.id === openId)
  const [shown, setShown] = React.useState(found)
  if (found && found !== shown) setShown(found)

  const filling = jars.filter((jar) => !jar.goal?.completedAt)
  // Finished ones, the latest first.
  const done = jars
    .filter((jar) => jar.goal?.completedAt)
    .sort((left, right) => right.goal!.completedAt!.localeCompare(left.goal!.completedAt!))

  return (
    <>
      {part === "open" ? (
        <>
          {/* A list on phones; from lg up cards the size of the accounts', the last a dashed one to add. */}
          <div className="lg:hidden">
            <SettingsGroup title={filling.length ? `Hũ tiết kiệm · ${filling.length}` : "Hũ tiết kiệm"}>
              {filling.map((jar) => (
                <JarRow key={jar.id} jar={jar} today={today} onSelect={() => setOpenId(jar.id)} />
              ))}
              <SettingsRow
                media={<IconTile icon={PlusIcon} tone="neutral" size="sm" />}
                title="Thêm hũ"
                chevron={false}
                onClick={() => setForm({ open: true, mode: "new" })}
              />
            </SettingsGroup>
          </div>
          <section className="hidden flex-col gap-2 lg:flex">
            <h2 className={cn("px-4", groupCaptionClassName)}>{filling.length ? `Hũ tiết kiệm · ${filling.length}` : "Hũ tiết kiệm"}</h2>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {filling.map((jar) => (
                <JarCard key={jar.id} jar={jar} today={today} onSelect={() => setOpenId(jar.id)} />
              ))}
              <AddCard label="Thêm hũ" onClick={() => setForm({ open: true, mode: "new" })} />
            </div>
          </section>
        </>
      ) : done.length > 0 ? (
        <SettingsGroup title="Hũ đã hoàn thành" collapsible={{ showLabel: `Hiện ${done.length} hũ` }}>
          {done.map((jar) => {
            const icon = getJarIcon(jar.goal)
            const price = recentTransactions[jar.id]?.find((transaction) => transaction.kind === "expense" && transaction.accountId === jar.id)?.amount
            return (
              <SettingsRow
                key={jar.id}
                media={<IconTile icon={icon.icon} tone="neutral" size="sm" />}
                title={jar.name}
                description={[`Đã mua ${formatShortDate(toDateKey(jar.goal!.completedAt!))}`, price ? formatCurrency(Math.abs(price)) : null].filter(Boolean).join(" · ")}
                muted
                onClick={() => setOpenId(jar.id)}
              />
            )
          })}
        </SettingsGroup>
      ) : null}

      {shown ? (
        <JarSheet
          jar={shown}
          transactions={recentTransactions[shown.id] ?? []}
          open={found !== undefined}
          onOpenChange={(open) => !open && setOpenId(null)}
          onEdit={() => setForm({ open: true, mode: "edit" })}
          onMove={(way) => setMove({ open: true, way })}
          onBought={() => setBuying(true)}
        >
          {/* Pushed into the jar's sheet, ‹ back to it (2026-10-18). */}
          <MoveJarSheet
            jar={shown}
            way={move.way}
            accounts={accounts}
            open={move.open}
            onOpenChange={(open) => setMove((current) => ({ ...current, open }))}
          />
          <BoughtSheet
            jar={shown}
            accounts={accounts}
            categoryGroups={categoryGroups}
            // Its moves come newest first.
            since={recentTransactions[shown.id]?.[0]?.occurredAt}
            open={buying}
            onOpenChange={setBuying}
            onDone={() => setOpenId(null)}
          />
          <JarFormSheet
            jar={shown}
            open={form.open && form.mode === "edit"}
            onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
            onDeleted={() => setOpenId(null)}
          />
        </JarSheet>
      ) : null}
      {/* A new jar: a sheet of its own. */}
      <JarFormSheet
        open={form.open && form.mode === "new"}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
      />
    </>
  )
}
