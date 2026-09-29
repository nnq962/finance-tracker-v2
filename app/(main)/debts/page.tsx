import { getAccounts } from "@/lib/accounts/repository"
import { requireSession } from "@/lib/auth/session"

import { DebtsDashboard } from "./_components/debts-dashboard"
import {
  getContacts,
  getDebtPayments,
  getDebtSummaries,
} from "@/lib/debts/repository"

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ debt?: string }> }) {
  const { debt } = await searchParams
  const user = await requireSession()
  const [accounts, contacts, debtSummaries] = await Promise.all([
    getAccounts(user.uid),
    getContacts(user.uid),
    getDebtSummaries(user.uid),
  ])
  const selectedDebtId = debtSummaries.some((item) => item.id === debt)
    ? debt
    : debtSummaries[0]?.id
  const selectedPayments = selectedDebtId
    ? await getDebtPayments(user.uid, selectedDebtId)
    : []
  const debts = debtSummaries.map((item) =>
    item.id === selectedDebtId
      ? { ...item, payments: selectedPayments }
      : item,
  )

  return (
    <DebtsDashboard
      selectedDebtId={selectedDebtId}
      accounts={accounts}
      initialContacts={contacts}
      initialDebts={debts}
    />
  )
}
