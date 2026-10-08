"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"

import { PageSheet } from "@/components/app/page-sheet"
import { CategoryManagementSheet } from "@/components/categories/category-management-sheet"
import { Button } from "@/components/ui/button"
import type { Account } from "@/lib/accounts/types"
import type { CategoryGroup } from "@/lib/categories/types"
import type { SupportedTransactionKind } from "@/lib/transactions/types"

import { createTransactionAction } from "../../actions"
import type { TransactionDraft } from "./form-types"
import { NeedAccountState } from "./need-account-state"
import { TransactionForm } from "./transaction-form"
import { TransactionKindSelector } from "./transaction-kind-selector"

type AddTransactionSheetProps = {
  accounts: Account[]
  categoryGroups: CategoryGroup[]
  /** Controlled mode without the trigger button, e.g. from the first-run checklist. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The tab it opens on, e.g. transfer for the transfer mission. */
  initialKind?: SupportedTransactionKind
  /** Opens filled in, on the draft's kind. */
  draft?: TransactionDraft
}

export function AddTransactionSheet({
  accounts,
  categoryGroups,
  open: controlledOpen,
  onOpenChange,
  initialKind = "expense",
  draft,
}: AddTransactionSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [categoryManagementOpen, setCategoryManagementOpen] = React.useState(false)
  const [kind, setKind] = React.useState<SupportedTransactionKind>(draft?.kind ?? initialKind)
  const hasAccount = accounts.some((account) => account.status === "active")

  return (
    <>
      <PageSheet
        title="Giao dịch mới"
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          // Closing starts over, on the tab it opens on.
          if (!next) setKind(draft?.kind ?? initialKind)
        }}
        trigger={
          controlledOpen === undefined ? (
            <Button type="button" className="w-full sm:w-auto">
              <PlusIcon />
              {/* Only the + on tablets, where the header's row is short of room. */}
              <span className="md:max-lg:sr-only">Thêm giao dịch</span>
            </Button>
          ) : undefined
        }
      >
        {hasAccount ? (
          <>
            {/* Switching tabs keeps what was filled in; closing the sheet starts over. */}
            <TransactionForm
              accounts={accounts}
              action={createTransactionAction}
              categoryGroups={categoryGroups}
              draft={draft}
              header={<TransactionKindSelector value={kind} onValueChange={setKind} />}
              isCreating
              kind={kind}
              onManageCategories={() => setCategoryManagementOpen(true)}
              onSuccess={() => setOpen(false)}
              successMessage="Đã thêm giao dịch."
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-center pb-8">
            <NeedAccountState />
          </div>
        )}
      </PageSheet>
      <CategoryManagementSheet
        key={kind}
        groups={categoryGroups}
        initialType={kind === "income" ? "income" : "expense"}
        open={categoryManagementOpen}
        onOpenChange={setCategoryManagementOpen}
      />
    </>
  )
}
