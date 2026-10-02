import { getAccounts } from "@/lib/accounts/repository"
import { loadWithSession } from "@/lib/auth/session"

import { DebtsDashboard } from "./_components/debts-dashboard"
import { compareDebtsByUrgency } from "./_lib/debt-presentation"
import {
  getContacts,
  getDebtPayments,
  getDebtSummaries,
} from "@/lib/debts/repository"

export default async function DebtsPage({ searchParams }: { searchParams: Promise<{ debt?: string }> }) {
  const { debt } = await searchParams
  const {
    data: [accounts, contacts, debtSummaries, requestedPayments],
    user,
  } = await loadWithSession((user) =>
    Promise.all([
      getAccounts(user.uid),
      getContacts(user.uid),
      getDebtSummaries(user.uid),
      // With a debt in the URL its payments load alongside the summaries
      // instead of after them; the result is discarded if the id is unknown.
      debt ? getDebtPayments(user.uid, debt).catch(() => null) : null,
    ]),
  )
  // Without a debt in the URL, the side panel opens the most urgent open one.
  const defaultDebt = debtSummaries
    .filter((item) => item.status !== "settled")
    .sort(compareDebtsByUrgency)[0] ?? debtSummaries[0]
  const selectedDebtId = debtSummaries.some((item) => item.id === debt)
    ? debt
    : defaultDebt?.id
  const selectedPayments = !selectedDebtId
    ? []
    : selectedDebtId === debt && requestedPayments
      ? requestedPayments
      : await getDebtPayments(user.uid, selectedDebtId)
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
