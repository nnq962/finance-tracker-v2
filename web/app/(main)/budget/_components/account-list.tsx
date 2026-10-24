"use client"

import * as React from "react"
import { PlusIcon, WalletIcon } from "lucide-react"

import { AccountLogo } from "@/components/account-logo"
import { IconTile } from "@/components/app/icon-tile"
import { Money } from "@/components/app/money"
import { PageSheet } from "@/components/app/page-sheet"
import { ShelfLink } from "@/components/app/shelf-link"
import { SettingsGroup, SettingsRow, groupCaptionClassName } from "@/components/settings-list"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { Transaction } from "@/lib/transactions/types"
import { cn } from "@/lib/utils"

import { AccountCard } from "./account-card"
import { accountGridClassName } from "./account-grid"
import { AccountSheet } from "./account-sheet"
import { AddAccountSheet } from "./add-account/add-account-sheet"
import { JarList } from "./savings/jar-section"

type AccountListProps = {
  accounts: Account[]
  recentTransactions: Record<string, Transaction[]>
  categoryGroups: CategoryGroup[]
  /** An account whose sheet opens straight away (a notice about it). */
  initialOpenId?: string
}

function AccountRow({ account, onSelect }: { account: Account; onSelect: () => void }) {
  // Left out of the figures (its balance not in the total) or locked: the balance greys, a locked one wholly.
  const isExcluded = account.excluded
  const locked = account.status === "archived"

  return (
    <SettingsRow
      media={<AccountLogo account={account} />}
      title={account.name}
      // Its kind is left to the logo (2026-10-16), the desktop card still says it; only
      // "Ngoài báo cáo" stays under the name: still used, not counted, its balance grey.
      description={account.excluded ? "Ngoài báo cáo" : undefined}
      // A locked account reads as not in use, as a finished jar (2026-10-21).
      muted={locked}
      action={
        <Money
          amount={account.balance}
          size="row"
          // Below zero is a warning; a balance outside the total greys.
          tone={isExcluded || locked ? "muted" : account.balance < 0 ? "expense" : "default"}
        />
      }
      onClick={onSelect}
    />
  )
}

export function AccountList({ accounts, recentTransactions, categoryGroups, initialOpenId }: AccountListProps) {
  const [openAccountId, setOpenAccountId] = React.useState<string | null>(initialOpenId ?? null)
  // Adding the first account, from the empty state; otherwise the page's + adds (2026-10-24).
  const [adding, setAdding] = React.useState(false)
  // Every account in use in one list, largest balance first, those left out
  // of the figures among them (still used, only not counted), marked so.
  // Savings jars are accounts too, listed in groups of their own.
  const jars = accounts.filter((account) => account.type === "savings")
  const activeAccounts = accounts
    .filter((account) => account.status === "active" && account.type !== "savings")
    .sort((left, right) => right.balance - left.balance)
  const archivedAccounts = accounts.filter((account) => account.status === "archived" && account.type !== "savings")
  const doneJars = jars.filter((jar) => jar.goal?.completedAt)
  // "Lưu trữ": the locked accounts and the finished jars, in a sheet of their own; open from the
  // start when the account or jar to open (a notice, a link) is one of them.
  const [stored, setStored] = React.useState(
    () =>
      archivedAccounts.some((account) => account.id === initialOpenId) ||
      doneJars.some((jar) => jar.id === initialOpenId),
  )
  // A deleted account closes its sheet.
  const openAccount = accounts.find((account) => account.id === openAccountId && account.type !== "savings")
  // Opened from "Lưu trữ": pushed into its sheet rather than a sheet of its own.
  const inStored = stored && openAccount?.status === "archived"

  if (accounts.length === 0) {
    // One card under the title (2026-10-23, the handoff): the lime wallet, what to do, the button.
    return (
      <Card className="mt-[18px] items-center gap-0 rounded-[28px] px-6 pt-9 pb-[26px] text-center lg:mt-0">
        <IconTile icon={WalletIcon} tone="accent" size="xl" />
        <div className="mt-[18px] flex flex-col gap-1.5">
          <h2 className="text-[21px] leading-tight font-extrabold tracking-[-0.02em]">Chưa có tài khoản</h2>
          <p className="text-[15px] font-semibold text-balance text-muted-foreground">Thêm tài khoản đầu tiên để bắt đầu.</p>
        </div>
        <Button type="button" className="mt-[22px]" onClick={() => setAdding(true)}>
          <PlusIcon data-icon="inline-start" />
          Thêm tài khoản
        </Button>
        <AddAccountSheet open={adding} onOpenChange={setAdding} />
      </Card>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* "Tài khoản chính" (2026-10-14, was "Đang dùng"), "Hũ tiết kiệm" and "Đã khoá" below it. A list on
          phones; from lg up a grid of cards with logo, name and balance, so the page uses its width.
          Nothing to add in them (2026-10-24): the page's + adds. None in use (every one locked): no group. */}
      {activeAccounts.length > 0 ? (
        <>
          <div className="lg:hidden">
            <SettingsGroup title={`Tài khoản chính · ${activeAccounts.length}`}>
              {activeAccounts.map((account) => (
                <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
              ))}
            </SettingsGroup>
          </div>
          <section className="hidden flex-col gap-2 lg:flex">
            <h2 className={cn("px-4", groupCaptionClassName)}>{`Tài khoản chính · ${activeAccounts.length}`}</h2>
            <div className={accountGridClassName}>
              {activeAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onSelect={() => setOpenAccountId(account.id)}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {/* The savings jars under the accounts in use, the locked accounts and finished jars after them. */}
      <JarList jars={jars} accounts={accounts} recentTransactions={recentTransactions} categoryGroups={categoryGroups} part="open" initialOpenId={initialOpenId} />

      {/* What is no longer in use is not folded into the page (2026-10-21): one quiet line opens
          "Lưu trữ", the locked accounts and the finished jars, each opening inside it, ‹ back. */}
      {archivedAccounts.length > 0 || doneJars.length > 0 ? (
        <>
          {/* Phones: a full-width row (2026-10-23, the handoff); from lg the quiet centred line. */}
          <ShelfLink align="fill" className="-mt-2.5 lg:hidden" onClick={() => setStored(true)}>
            {`Lưu trữ · ${[
              archivedAccounts.length ? `${archivedAccounts.length} tài khoản` : null,
              doneJars.length ? `${doneJars.length} hũ` : null,
            ]
              .filter(Boolean)
              .join(", ")}`}
          </ShelfLink>
          <ShelfLink className="hidden lg:flex" onClick={() => setStored(true)}>
            {[
              archivedAccounts.length ? `${archivedAccounts.length} tài khoản đã khoá` : null,
              doneJars.length ? `${doneJars.length} hũ đã xong` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </ShelfLink>
        </>
      ) : null}

      <PageSheet title="Lưu trữ" open={stored} onOpenChange={setStored} className="gap-6">
        {archivedAccounts.length > 0 ? (
          <SettingsGroup
            title={`Đã khoá · ${archivedAccounts.length}`}
            footer="Không hiện khi chọn tài khoản cho giao dịch mới. Mở một tài khoản để mở khoá lại."
          >
            {archivedAccounts.map((account) => (
              <AccountRow key={account.id} account={account} onSelect={() => setOpenAccountId(account.id)} />
            ))}
          </SettingsGroup>
        ) : null}
        {doneJars.length > 0 ? (
          <JarList
            jars={jars}
            accounts={accounts}
            recentTransactions={recentTransactions}
            categoryGroups={categoryGroups}
            part="done"
            initialOpenId={initialOpenId}
          />
        ) : null}
        <AccountSheet
          account={inStored ? openAccount : undefined}
          accounts={accounts}
          transactions={inStored && openAccount ? recentTransactions[openAccount.id] ?? [] : []}
          categoryGroups={categoryGroups}
          onOpenChange={(open) => {
            if (!open) setOpenAccountId(null)
          }}
        />
      </PageSheet>

      <AccountSheet
        account={inStored ? undefined : openAccount}
        accounts={accounts}
        transactions={openAccount && !inStored ? recentTransactions[openAccount.id] ?? [] : []}
        categoryGroups={categoryGroups}
        onOpenChange={(open) => {
          if (!open) setOpenAccountId(null)
        }}
      />
    </div>
  )
}
