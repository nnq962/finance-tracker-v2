"use client"

import * as React from "react"

import { IconTile } from "@/components/app/icon-tile"
import { groupCaptionClassName, SettingsGroup, SettingsRow } from "@/components/settings-list"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import { formatCurrency } from "@/lib/format-currency"
import { formatShortDate, toDateKey } from "@/lib/format-date"
import { getJarIcon } from "@/lib/savings/jar-icons"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { accountGridClassName } from "../account-grid"
import { AddCard } from "../add-card"
import { BoughtSheet } from "./bought-sheet"
import { AddJarTile, JarCard, JarTile } from "./jar-card"
import { JarFormSheet } from "./jar-form-sheet"
import { JarSheet } from "./jar-sheet"
import { MoveJarSheet } from "./move-jar-sheet"

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
  /** `open`: the group being filled, above the accounts; `done`: the finished ones, in the "Lưu trữ" sheet. */
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

  // What a finished jar paid for its purchase: its last spending.
  const priceOf = (jar: Account) =>
    recentTransactions[jar.id]?.find((transaction) => transaction.kind === "expense" && transaction.accountId === jar.id)?.amount

  // The open jar's sheet, with what it pushes in: in the finished jars' sheet when opened from it.
  const jarSheet = shown ? (
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
  ) : null

  return (
    <>
      {part === "open" ? (
        <>
          {/* A list on phones, with no line under it (2026-10-21); from lg up the
              accounts grid's cards, the last a dashed one to add, alone the same one cell when
              there is no jar yet (2026-10-21: a full-width row was rejected). */}
          {/* Phones (2026-10-23, the handoff): a two-up grid of jar cards, the last a grey one to add. */}
          <section className="flex flex-col gap-2 lg:hidden">
            <h2 className={cn("px-4", groupCaptionClassName)}>{filling.length ? `Hũ tiết kiệm · ${filling.length}` : "Hũ tiết kiệm"}</h2>
            <div className="grid grid-cols-2 gap-3">
              {filling.map((jar) => (
                <JarTile key={jar.id} jar={jar} today={today} onSelect={() => setOpenId(jar.id)} />
              ))}
              <AddJarTile onClick={() => setForm({ open: true, mode: "new" })} />
            </div>
          </section>
          <section className="hidden flex-col gap-2 lg:flex">
            <h2 className={cn("px-4", groupCaptionClassName)}>{filling.length ? `Hũ tiết kiệm · ${filling.length}` : "Hũ tiết kiệm"}</h2>
            <div className={accountGridClassName}>
              {filling.map((jar) => (
                <JarCard key={jar.id} jar={jar} today={today} onSelect={() => setOpenId(jar.id)} />
              ))}
              <AddCard label="Thêm hũ" onClick={() => setForm({ open: true, mode: "new" })} />
            </div>
          </section>
        </>
      ) : (
        // The finished jars, in the accounts page's "Lưu trữ" sheet; one opened is pushed into it.
        <SettingsGroup title={`Hũ đã hoàn thành · ${done.length}`}>
          {done.map((jar) => {
            const icon = getJarIcon(jar.goal)
            const price = priceOf(jar)
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
      )}

      {jarSheet}
      {/* A new jar: a sheet of its own. */}
      <JarFormSheet
        open={form.open && form.mode === "new"}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
      />
    </>
  )
}
