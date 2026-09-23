"use client"

import * as React from "react"

import type { Account } from "@/lib/accounts/types"

import { getDebtSummary } from "../_lib/get-debt-summary"
import type {
  Contact,
  Debt,
  NewDebt,
  NewDebtPayment,
} from "../_types/debt"
import { AddDebtSheet } from "./add-debt-sheet"
import { DebtSummary } from "./debt-summary"
import { DebtsHeader } from "./debts-header"
import { DebtsView } from "./debts-view"

type DebtsDashboardProps = {
  accounts: Account[]
  initialContacts: Contact[]
  initialDebts: Debt[]
}

export function DebtsDashboard({
  accounts,
  initialContacts,
  initialDebts,
}: DebtsDashboardProps) {
  const contacts = initialContacts
  const [debts, setDebts] = React.useState(initialDebts)
  const summary = getDebtSummary(debts)

  const addDebt = (values: NewDebt) => {
    setDebts((current) => [
      {
        ...values,
        id: `debt-${Date.now()}`,
        status: "active",
      },
      ...current,
    ])
  }

  const recordPayment = (debtId: string, payment: NewDebtPayment) => {
    setDebts((current) =>
      current.map((debt) => {
        if (debt.id !== debtId) return debt

        const paidAmount = Math.min(
          debt.paidAmount + payment.amount,
          debt.amount,
        )

        return {
          ...debt,
          paidAmount,
          status: paidAmount === debt.amount ? "settled" : debt.status,
          payments: [
            ...(debt.payments ?? []),
            { ...payment, id: `payment-${Date.now()}` },
          ],
        }
      }),
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-24">
      <DebtsHeader
        actions={
          <AddDebtSheet
            accounts={accounts}
            contacts={contacts}
            onAddDebt={addDebt}
          />
        }
      />
      <DebtSummary summary={summary} />
      <DebtsView
        contacts={contacts}
        debts={debts}
        onRecordPayment={recordPayment}
      />
    </div>
  )
}
