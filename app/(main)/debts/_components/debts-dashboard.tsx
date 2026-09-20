"use client"

import * as React from "react"

import { getDebtSummary } from "../_lib/get-debt-summary"
import type {
  Contact,
  Debt,
  NewContact,
  NewDebtPayment,
} from "../_types/debt"
import { AddContactSheet } from "./add-contact-sheet"
import { DebtSummary } from "./debt-summary"
import { DebtsHeader } from "./debts-header"
import { DebtsView } from "./debts-view"

type DebtsDashboardProps = {
  initialContacts: Contact[]
  initialDebts: Debt[]
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN")
}

export function DebtsDashboard({ initialContacts, initialDebts }: DebtsDashboardProps) {
  const [contacts, setContacts] = React.useState(initialContacts)
  const [debts, setDebts] = React.useState(initialDebts)
  const summary = getDebtSummary(debts)

  const addContact = (values: NewContact) => {
    const name = values.name.trim()
    setContacts((current) => [
      ...current,
      {
        ...values,
        id: `contact-${Date.now()}`,
        name,
        initials: getInitials(name),
      },
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
          <AddContactSheet onAddContact={addContact} />
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
